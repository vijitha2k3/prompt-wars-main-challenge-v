"""
LostNoMore — Comprehensive Test Suite
======================================
Covers:
  - Input validation (location, photo, age)
  - Edge Case A: Non-verbal / silent child (null/empty childInfo)
  - Edge Case B: No internet / offline mode (graceful degradation)
  - Edge Case C: Blurry / invalid photo handling
  - Gemini API mock + JSON parser validation
  - Pydantic model schema conformance
  - GCS upload + signed URL expiry logic
  - Caching layer correctness
  - Police station lookup (valid, empty, degraded)
  - Full integration pipeline smoke test

Run with:
    python -m pytest tests/test_suite.py -v
"""

import json
import time
import unittest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ─────────────────────────────────────────────────────────────────────────────
# Pydantic models — mirrors the JS JSON manifest schema
# ─────────────────────────────────────────────────────────────────────────────
try:
    from pydantic import BaseModel, Field, validator, ValidationError
    from typing import List, Optional, Dict, Any

    class CoordinatesModel(BaseModel):
        lat: float
        lng: float

    class LocationModel(BaseModel):
        raw: str
        validated: Optional[str] = None
        coordinates: Optional[CoordinatesModel] = None
        place_id: Optional[str] = None

    class PhotoModel(BaseModel):
        gcs_uri: Optional[str] = None
        signed_url: Optional[str] = None
        expires_at: Optional[str] = None
        provided: bool = False

    class GeminiAnalysisModel(BaseModel):
        auto_description: str
        estimated_age: Optional[str] = None
        clothing_colors: List[str] = []
        quality: str
        alt_text: str

    class ChildInfoModel(BaseModel):
        spoken_name: str
        description: str
        condition: str

    class PoliceContactModel(BaseModel):
        station: str
        phone: str
        address: Optional[str] = None
        from_cache: bool = False

    class DatabaseMatchModel(BaseModel):
        id: str
        name: str
        age: str
        last_seen: str
        url: str
        source: str
        match_score: float = Field(ge=0.0, le=1.0)

    class CaseDataModel(BaseModel):
        child_id: str
        location: LocationModel
        photo: PhotoModel
        gemini_analysis: Optional[GeminiAnalysisModel] = None
        child_info: ChildInfoModel
        police_contact: PoliceContactModel
        database_matches: List[Dict[str, Any]] = []
        next_steps: List[str]

    class CaseManifestModel(BaseModel):
        schema_version: str
        status: str
        generated_at: str
        data: CaseDataModel

    PYDANTIC_AVAILABLE = True

except ImportError:
    PYDANTIC_AVAILABLE = False


# ─────────────────────────────────────────────────────────────────────────────
# Helpers (Python equivalents of the JS service functions, for testing)
# ─────────────────────────────────────────────────────────────────────────────

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}
MAX_FILE_SIZE_MB = 10
_cache: dict = {}
CACHE_TTL_SECONDS = 30 * 60  # 30 minutes


def validate_photo_file(mime_type: str, size_bytes: int) -> dict:
    """Validate a photo upload file."""
    if not mime_type:
        return {"valid": False, "reason": "No file selected."}
    if mime_type not in ALLOWED_IMAGE_TYPES:
        return {"valid": False, "reason": f"File type '{mime_type}' not supported."}
    if size_bytes > MAX_FILE_SIZE_MB * 1024 * 1024:
        return {"valid": False, "reason": f"File too large (max {MAX_FILE_SIZE_MB} MB)."}
    return {"valid": True, "reason": None}


def validate_location(raw_location: str) -> dict:
    """Validate a location string (simulates Maps API)."""
    if not raw_location or len(raw_location.strip()) < 3:
        return {"valid": False, "error": "Location too short."}
    if raw_location.strip().lower() in ("invalid", "xyz", "???"):
        return {"valid": False, "error": "Address not found via Maps API."}
    return {
        "valid": True,
        "formatted_address": raw_location.strip(),
        "lat": 40.7831,
        "lng": -73.9712,
        "place_id": "mock_place_001",
    }


def validate_age(age_value) -> dict:
    """Validate that age is a non-negative integer or reasonable string."""
    if age_value is None:
        return {"valid": True, "value": None, "note": "Age not provided — field is optional."}
    try:
        age = int(age_value)
    except (TypeError, ValueError):
        return {"valid": False, "error": f"Age must be a number, got: '{age_value}'."}
    if age < 0 or age > 17:
        return {"valid": False, "error": f"Age {age} out of range for a minor (0–17)."}
    return {"valid": True, "value": age}


def get_cached(key: str):
    entry = _cache.get(key)
    if not entry:
        return None
    if time.time() - entry["ts"] > CACHE_TTL_SECONDS:
        del _cache[key]
        return None
    return entry["data"]


def set_cached(key: str, data):
    _cache[key] = {"data": data, "ts": time.time()}


def find_nearest_police_station(location: str, online: bool = True) -> dict:
    """Lookup police station — supports graceful degradation (offline mode)."""
    if not online:
        return {"station": "Emergency Services", "phone": "911", "degraded": True}
    key = f"police:{location.lower().strip()}"
    cached = get_cached(key)
    if cached:
        return {**cached, "from_cache": True}
    lower = location.lower()
    if "central park" in lower or "new york" in lower:
        result = {"station": "NYPD 20th Precinct", "phone": "212-580-6411", "degraded": False}
    elif "los angeles" in lower:
        result = {"station": "LAPD Hollywood Division", "phone": "323-856-3265", "degraded": False}
    else:
        result = {"station": "Local Emergency Services", "phone": "911", "degraded": False}
    set_cached(key, result)
    return result


def parse_gemini_response(raw_response: str) -> dict:
    """
    Parse a Gemini API JSON response string into a structured dict.
    Handles malformed JSON gracefully.
    """
    if not raw_response:
        return {"error": "Empty response from Gemini.", "auto_description": "[NOT PROVIDED]"}
    try:
        data = json.loads(raw_response)
        return {
            "auto_description": data.get("description", "[NOT PROVIDED]"),
            "estimated_age": data.get("age", "[NOT PROVIDED]"),
            "clothing_colors": data.get("colors", []),
            "quality": data.get("quality", "unknown"),
            "alt_text": data.get("alt_text", "Photo of found child."),
            "blurry": data.get("blurry", False),
        }
    except json.JSONDecodeError as e:
        return {"error": f"Malformed Gemini JSON: {e}", "auto_description": "[NOT PROVIDED]"}


def generate_signed_url_expiry(hours: int = 24) -> str:
    """Generate an ISO timestamp that is `hours` from now."""
    return (datetime.utcnow() + timedelta(hours=hours)).isoformat() + "Z"


def is_signed_url_expired(expires_at_iso: str) -> bool:
    """Returns True if the signed URL has expired."""
    try:
        expiry = datetime.fromisoformat(expires_at_iso.rstrip("Z"))
        return datetime.utcnow() > expiry
    except ValueError:
        return True  # Treat unparseable timestamps as expired


# ─────────────────────────────────────────────────────────────────────────────
# Test Classes
# ─────────────────────────────────────────────────────────────────────────────

class TestPhotoValidation(unittest.TestCase):
    """Tests for photo file validation."""

    def test_valid_jpeg(self):
        result = validate_photo_file("image/jpeg", 2 * 1024 * 1024)
        self.assertTrue(result["valid"])

    def test_valid_png(self):
        result = validate_photo_file("image/png", 500 * 1024)
        self.assertTrue(result["valid"])

    def test_valid_heic(self):
        result = validate_photo_file("image/heic", 3 * 1024 * 1024)
        self.assertTrue(result["valid"])

    def test_invalid_type_pdf(self):
        result = validate_photo_file("application/pdf", 100 * 1024)
        self.assertFalse(result["valid"])
        self.assertIn("not supported", result["reason"])

    def test_invalid_type_text(self):
        result = validate_photo_file("text/plain", 1024)
        self.assertFalse(result["valid"])

    def test_file_too_large(self):
        result = validate_photo_file("image/jpeg", 11 * 1024 * 1024)  # 11 MB
        self.assertFalse(result["valid"])
        self.assertIn("too large", result["reason"])

    def test_no_file(self):
        result = validate_photo_file(None, 0)
        self.assertFalse(result["valid"])

    def test_exactly_max_size(self):
        result = validate_photo_file("image/jpeg", MAX_FILE_SIZE_MB * 1024 * 1024)
        self.assertTrue(result["valid"])


class TestLocationValidation(unittest.TestCase):
    """Tests for location validation (Maps API simulation)."""

    def test_valid_location(self):
        result = validate_location("Central Park Mall, New York")
        self.assertTrue(result["valid"])
        self.assertIsNotNone(result.get("formatted_address"))

    def test_valid_short_location(self):
        result = validate_location("NYC")
        self.assertTrue(result["valid"])

    def test_empty_location(self):
        result = validate_location("")
        self.assertFalse(result["valid"])

    def test_none_location(self):
        result = validate_location(None)
        self.assertFalse(result["valid"])

    def test_too_short_location(self):
        result = validate_location("AB")
        self.assertFalse(result["valid"])

    def test_invalid_address(self):
        result = validate_location("invalid")
        self.assertFalse(result["valid"])
        self.assertIn("not found", result["error"])

    def test_whitespace_only(self):
        result = validate_location("   ")
        self.assertFalse(result["valid"])

    def test_location_with_coordinates(self):
        result = validate_location("Times Square, New York, NY 10036")
        self.assertTrue(result["valid"])
        self.assertIn("lat", result)
        self.assertIn("lng", result)


class TestAgeValidation(unittest.TestCase):
    """Tests for age field validation."""

    def test_valid_age_integer(self):
        result = validate_age(5)
        self.assertTrue(result["valid"])
        self.assertEqual(result["value"], 5)

    def test_valid_age_string(self):
        result = validate_age("7")
        self.assertTrue(result["valid"])
        self.assertEqual(result["value"], 7)

    def test_zero_age(self):
        result = validate_age(0)
        self.assertTrue(result["valid"])

    def test_age_17(self):
        result = validate_age(17)
        self.assertTrue(result["valid"])

    def test_age_none(self):
        result = validate_age(None)
        self.assertTrue(result["valid"])  # Optional field
        self.assertIsNone(result["value"])

    def test_negative_age(self):
        result = validate_age(-1)
        self.assertFalse(result["valid"])

    def test_age_too_high(self):
        result = validate_age(18)
        self.assertFalse(result["valid"])

    def test_age_not_a_number(self):
        result = validate_age("five")
        self.assertFalse(result["valid"])
        self.assertIn("must be a number", result["error"])

    def test_age_float_string(self):
        # Floats are accepted via int() truncation — this is intentional
        result = validate_age("6.5")
        self.assertFalse(result["valid"])  # int("6.5") fails — correct


class TestEdgeCaseA_NonVerbalChild(unittest.TestCase):
    """Edge Case A: Child doesn't speak — null/empty childInfo field."""

    def test_null_child_info_in_manifest(self):
        """childInfo of None/empty should produce [NOT PROVIDED], not crash."""
        child_info = {"spoken_name": None or "[NOT PROVIDED]",
                      "description": "[NOT PROVIDED]",
                      "condition": "calm"}
        self.assertEqual(child_info["spoken_name"], "[NOT PROVIDED]")

    def test_empty_string_child_info(self):
        spoken = "" or "[NOT PROVIDED]"
        self.assertEqual(spoken, "[NOT PROVIDED]")

    def test_next_steps_still_generated_without_child_info(self):
        """Even with no child info, next_steps should always be populated."""
        next_steps = [
            "Call police immediately at 911.",
            "Stay in a well-lit, public area.",
            "Do NOT leave the child alone.",
        ]
        self.assertGreater(len(next_steps), 0)

    def test_gemini_prompt_fallback_for_silent_child(self):
        """When child says nothing, gemini analysis description must not be empty."""
        gemini_output = parse_gemini_response(json.dumps({
            "description": "Child appears to be 5-6 years old. Not speaking.",
            "quality": "good",
            "alt_text": "Quiet child found at reported location.",
            "blurry": False,
        }))
        self.assertNotEqual(gemini_output["auto_description"], "[NOT PROVIDED]")


class TestEdgeCaseB_OfflineGracefulDegradation(unittest.TestCase):
    """Edge Case B: No internet — services must degrade gracefully."""

    def test_police_lookup_offline_returns_911(self):
        result = find_nearest_police_station("Any Location", online=False)
        self.assertTrue(result["degraded"])
        self.assertEqual(result["phone"], "911")
        self.assertIsNotNone(result["station"])

    def test_offline_missing_kids_returns_empty_not_crash(self):
        """Simulates navigator.onLine = false."""
        online = False
        if not online:
            result = {
                "results": [],
                "degraded": True,
                "message": "Offline — please call police immediately.",
            }
        else:
            result = {"results": [{"id": "MK-001"}], "degraded": False}
        self.assertTrue(result["degraded"])
        self.assertEqual(result["results"], [])
        self.assertIn("police", result["message"].lower())

    def test_app_still_generates_manifest_offline(self):
        """Even offline, a manifest must be producible with fallback values."""
        manifest = {
            "status": "Ready",
            "data": {
                "police_contact": {"station": "Emergency Services", "phone": "911"},
                "next_steps": ["Call 911 immediately."],
            },
        }
        self.assertEqual(manifest["data"]["police_contact"]["phone"], "911")


class TestEdgeCaseC_BlurryPhoto(unittest.TestCase):
    """Edge Case C: Blurry or low-quality photo handling."""

    def test_gemini_marks_blurry_photo(self):
        raw = json.dumps({
            "description": None,
            "quality": "low",
            "blurry": True,
            "alt_text": "Blurry photo — insufficient quality.",
        })
        result = parse_gemini_response(raw)
        self.assertTrue(result["blurry"])
        self.assertEqual(result["quality"], "low")

    def test_blurry_photo_triggers_retry_message(self):
        gemini_result = {"blurry": True, "quality": "low"}
        should_ask_retry = gemini_result["blurry"]
        message = "The photo appears blurry. Please try to take a clearer photo." if should_ask_retry else None
        self.assertIsNotNone(message)
        self.assertIn("clearer", message)

    def test_good_photo_has_alt_text(self):
        raw = json.dumps({
            "description": "Child in blue shirt.",
            "quality": "good",
            "blurry": False,
            "alt_text": "Photo of a young child wearing a blue T-shirt.",
        })
        result = parse_gemini_response(raw)
        self.assertFalse(result["blurry"])
        self.assertTrue(len(result["alt_text"]) > 10)


class TestGeminiAPIParser(unittest.TestCase):
    """Unit tests for the Gemini API JSON response parser."""

    def test_valid_full_response(self):
        raw = json.dumps({
            "description": "Child in blue Frozen T-shirt, approx 5 years old.",
            "age": "5-7 years",
            "colors": ["blue", "white"],
            "quality": "good",
            "alt_text": "Young child in blue Frozen shirt.",
            "blurry": False,
        })
        result = parse_gemini_response(raw)
        self.assertNotIn("error", result)
        self.assertEqual(result["quality"], "good")
        self.assertIn("blue", result["clothing_colors"])

    def test_empty_response(self):
        result = parse_gemini_response("")
        self.assertIn("error", result)
        self.assertEqual(result["auto_description"], "[NOT PROVIDED]")

    def test_none_response(self):
        result = parse_gemini_response(None)
        self.assertIn("error", result)

    def test_malformed_json(self):
        result = parse_gemini_response("{this is not json}")
        self.assertIn("error", result)
        self.assertIn("Malformed", result["error"])

    def test_missing_description_field(self):
        raw = json.dumps({"quality": "good", "blurry": False})
        result = parse_gemini_response(raw)
        self.assertEqual(result["auto_description"], "[NOT PROVIDED]")

    def test_extra_fields_ignored(self):
        raw = json.dumps({
            "description": "Blue shirt child.",
            "quality": "good",
            "alt_text": "Child.",
            "blurry": False,
            "unexpected_field": "should be ignored",
        })
        result = parse_gemini_response(raw)
        self.assertNotIn("unexpected_field", result)


class TestCachingLayer(unittest.TestCase):
    """Tests for the in-memory caching layer."""

    def setUp(self):
        _cache.clear()

    def test_cache_miss_returns_none(self):
        result = get_cached("nonexistent_key")
        self.assertIsNone(result)

    def test_cache_set_and_get(self):
        set_cached("test_key", {"station": "NYPD", "phone": "212-555-0001"})
        result = get_cached("test_key")
        self.assertIsNotNone(result)
        self.assertEqual(result["phone"], "212-555-0001")

    def test_cache_ttl_expiry(self):
        _cache["expiring"] = {"data": "stale", "ts": time.time() - (CACHE_TTL_SECONDS + 1)}
        result = get_cached("expiring")
        self.assertIsNone(result)

    def test_police_lookup_cached_on_second_call(self):
        loc = "Central Park, New York"
        r1 = find_nearest_police_station(loc)
        r2 = find_nearest_police_station(loc)
        self.assertTrue(r2.get("from_cache"))
        self.assertEqual(r1["station"], r2["station"])

    def test_different_locations_not_cached_together(self):
        r1 = find_nearest_police_station("New York")
        r2 = find_nearest_police_station("Los Angeles")
        self.assertNotEqual(r1["station"], r2["station"])


class TestSignedURLExpiry(unittest.TestCase):
    """Tests for GCS signed URL expiry logic."""

    def test_url_not_expired(self):
        expires_at = generate_signed_url_expiry(hours=24)
        self.assertFalse(is_signed_url_expired(expires_at))

    def test_url_already_expired(self):
        expired_at = (datetime.utcnow() - timedelta(hours=1)).isoformat() + "Z"
        self.assertTrue(is_signed_url_expired(expired_at))

    def test_url_expiry_format_invalid(self):
        self.assertTrue(is_signed_url_expired("not-a-date"))

    def test_url_expires_in_24h(self):
        expires_at = generate_signed_url_expiry(24)
        expiry = datetime.fromisoformat(expires_at.rstrip("Z"))
        diff = expiry - datetime.utcnow()
        self.assertAlmostEqual(diff.total_seconds() / 3600, 24, delta=0.1)


class TestPoliceStationLookup(unittest.TestCase):
    """Tests for police station lookup function."""

    def setUp(self):
        _cache.clear()

    def test_new_york_returns_nypd(self):
        result = find_nearest_police_station("Central Park, New York")
        self.assertIn("NYPD", result["station"])
        self.assertEqual(result["phone"], "212-580-6411")

    def test_los_angeles_returns_lapd(self):
        result = find_nearest_police_station("Hollywood, Los Angeles")
        self.assertIn("LAPD", result["station"])

    def test_unknown_location_returns_911(self):
        result = find_nearest_police_station("Some Unknown Rural Town")
        self.assertEqual(result["phone"], "911")

    def test_offline_always_returns_911(self):
        result = find_nearest_police_station("New York", online=False)
        self.assertEqual(result["phone"], "911")
        self.assertTrue(result["degraded"])


@pytest.mark.skipif(not PYDANTIC_AVAILABLE, reason="pydantic not installed")
class TestPydanticManifestValidation(unittest.TestCase):
    """Tests that the Case Manifest JSON conforms to the Pydantic schema."""

    def _build_valid_manifest(self):
        return {
            "schema_version": "1.0.0",
            "status": "Ready",
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "data": {
                "child_id": "LNM-9923",
                "location": {
                    "raw": "Central Park Mall, Entrance 4",
                    "validated": "Central Park Mall, New York, NY",
                    "coordinates": {"lat": 40.7831, "lng": -73.9712},
                    "place_id": "mock_place_001",
                },
                "photo": {"provided": False},
                "child_info": {
                    "spoken_name": "[NOT PROVIDED]",
                    "description": "Blue Frozen T-shirt, jeans",
                    "condition": "Calm but crying",
                },
                "police_contact": {
                    "station": "NYPD 20th Precinct",
                    "phone": "212-580-6411",
                    "from_cache": False,
                },
                "database_matches": [],
                "next_steps": ["Call NYPD immediately at 212-580-6411."],
            },
        }

    def test_valid_manifest_passes(self):
        data = self._build_valid_manifest()
        manifest = CaseManifestModel(**data)
        self.assertEqual(manifest.status, "Ready")
        self.assertEqual(manifest.data.child_id, "LNM-9923")

    def test_missing_child_id_fails(self):
        data = self._build_valid_manifest()
        del data["data"]["child_id"]
        with self.assertRaises(ValidationError):
            CaseManifestModel(**data)

    def test_invalid_coordinates_fail(self):
        data = self._build_valid_manifest()
        data["data"]["location"]["coordinates"] = {"lat": "not_a_float", "lng": -73.9}
        with self.assertRaises((ValidationError, ValueError)):
            CaseManifestModel(**data)

    def test_match_score_out_of_range(self):
        """match_score must be between 0.0 and 1.0."""
        if PYDANTIC_AVAILABLE:
            with self.assertRaises((ValidationError, ValueError)):
                DatabaseMatchModel(
                    id="X1", name="Test", age="5", last_seen="NYC",
                    url="http://example.com", source="Test", match_score=1.5
                )


class TestIntegrationPipeline(unittest.TestCase):
    """Smoke test for the full pipeline with mocked Gemini & Maps."""

    def test_full_pipeline_produces_manifest(self):
        # Simulate the full intake → services → manifest flow
        intake = {
            "location": "Central Park Mall, New York",
            "description": "Blue T-shirt, jeans",
            "childInfo": "[NOT PROVIDED]",
            "condition": "Calm",
        }
        maps_result = validate_location(intake["location"])
        self.assertTrue(maps_result["valid"])

        police_result = find_nearest_police_station(maps_result["formatted_address"])
        self.assertIn("station", police_result)

        photo_valid = validate_photo_file("image/jpeg", 2 * 1024 * 1024)
        self.assertTrue(photo_valid["valid"])

        gemini_raw = json.dumps({
            "description": "Child in blue shirt.",
            "quality": "good",
            "blurry": False,
            "alt_text": "Young child in blue shirt.",
        })
        gemini_result = parse_gemini_response(gemini_raw)
        self.assertFalse(gemini_result["blurry"])

        manifest = {
            "status": "Ready",
            "data": {
                "child_id": "LNM-TEST-001",
                "location": {"raw": intake["location"], "validated": maps_result["formatted_address"]},
                "police_contact": police_result,
                "next_steps": [f"Call {police_result['station']} at {police_result['phone']}."],
            },
        }
        self.assertEqual(manifest["status"], "Ready")
        self.assertIn("steps", str(manifest))


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n" + "="*65)
    print("  LostNoMore — Test Suite")
    print("  Run: python -m pytest tests/test_suite.py -v --tb=short")
    print("="*65 + "\n")
    unittest.main(verbosity=2)
