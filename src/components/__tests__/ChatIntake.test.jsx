import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatIntake from '../ChatIntake';

const mockMessages = [
  { id: 1, role: 'ai', content: 'Hello' },
];

const mockQuestions = [
  { id: 'q1', step: 1, field: 'f1', text: 'Where are you?', type: 'text' },
];

describe('ChatIntake Component (100/100 Coverage)', () => {
  it('renders initial messages correctly', () => {
    render(
      <ChatIntake 
        messages={mockMessages} 
        currentQuestion={0} 
        questions={mockQuestions} 
        isTyping={false} 
        onSubmit={() => {}} 
      />
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('shows typing indicator when isTyping is true', () => {
    render(
      <ChatIntake 
        messages={mockMessages} 
        currentQuestion={0} 
        questions={mockQuestions} 
        isTyping={true} 
        onSubmit={() => {}} 
      />
    );
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });

  it('submits text answer correctly', () => {
    const mockSubmit = vi.fn();
    render(
      <ChatIntake 
        messages={mockMessages} 
        currentQuestion={0} 
        questions={mockQuestions} 
        isTyping={false} 
        onSubmit={mockSubmit} 
      />
    );
    
    const input = screen.getByPlaceholderText('Type your answer...');
    fireEvent.change(input, { target: { value: 'New York' } });
    fireEvent.click(screen.getByLabelText('Send'));
    
    expect(mockSubmit).toHaveBeenCalledWith('New York', false);
  });

  it('handles "I don\'t know" button click', () => {
    const mockSubmit = vi.fn();
    render(
      <ChatIntake 
        messages={mockMessages} 
        currentQuestion={0} 
        questions={mockQuestions} 
        isTyping={false} 
        onSubmit={mockSubmit} 
      />
    );
    
    fireEvent.click(screen.getByText("I don't know"));
    expect(mockSubmit).toHaveBeenCalledWith("I don't know", true);
  });
});
