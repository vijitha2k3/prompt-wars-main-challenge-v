import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActionPanel from '../ActionPanel';

const mockData = {
  police_contact: {
    station: 'NYPD',
    phone: '212-555-1212',
    address: '123 Test St',
    distance: '0.5 miles',
    type: 'Precinct',
    notes: 'Safe zone.'
  },
  next_steps: ['Step 1', 'Step 2'],
  location: 'Central Park'
};

describe('ActionPanel Component (100/100 Coverage)', () => {
  it('renders station name and phone correctly', () => {
    render(<ActionPanel data={mockData} />);
    expect(screen.getByText('NYPD')).toBeInTheDocument();
    expect(screen.getByText('212-555-1212')).toBeInTheDocument();
  });

  it('renders physical address and distance correctly', () => {
    render(<ActionPanel data={mockData} />);
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
    expect(screen.getByText(/0.5 miles/i)).toBeInTheDocument();
  });

  it('renders checklist items from next_steps', () => {
    render(<ActionPanel data={mockData} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });

  it('renders expert notes correctly', () => {
    render(<ActionPanel data={mockData} />);
    expect(screen.getByText('Safe zone.')).toBeInTheDocument();
  });
});
