/**
 * PENNY WISE - UI COMPONENTS TESTS
 * Testing actual UI components from src/components/ui
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import actual UI components
import { Button } from '../../../src/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../src/components/ui/card';
import { Input } from '../../../src/components/ui/input';
import { Label } from '../../../src/components/ui/label';
import { Alert, AlertDescription } from '../../../src/components/ui/alert';

describe('UI Components', () => {
  describe('Button Component', () => {
    test('should render button with default variant', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
      expect(button).toHaveAttribute('data-slot', 'button');
    });

    test('should render button with different variants', () => {
      const { rerender } = render(<Button variant="default">Default</Button>);
      let button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      rerender(<Button variant="destructive">Destructive</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveTextContent('Destructive');

      rerender(<Button variant="outline">Outline</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveTextContent('Outline');

      rerender(<Button variant="secondary">Secondary</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveTextContent('Secondary');

      rerender(<Button variant="ghost">Ghost</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveTextContent('Ghost');

      rerender(<Button variant="link">Link</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveTextContent('Link');
    });

    test('should render button with different sizes', () => {
      const { rerender } = render(<Button size="default">Default Size</Button>);
      let button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      rerender(<Button size="sm">Small</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveTextContent('Small');

      rerender(<Button size="lg">Large</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveTextContent('Large');

      rerender(<Button size="icon">Icon</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveTextContent('Icon');
    });

    test('should handle disabled state', () => {
      render(<Button disabled>Disabled Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('should accept custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    test('should handle asChild prop', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent('Link Button');
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('Card Components', () => {
    test('should render card with content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card content goes here')).toBeInTheDocument();
      
      const card = screen.getByText('Card Title').closest('[data-slot="card"]');
      expect(card).toBeInTheDocument();
      
      const header = screen.getByText('Card Title').closest('[data-slot="card-header"]');
      expect(header).toBeInTheDocument();
      
      const title = screen.getByText('Card Title').closest('[data-slot="card-title"]');
      expect(title).toBeInTheDocument();
      
      const content = screen.getByText('Card content goes here').closest('[data-slot="card-content"]');
      expect(content).toBeInTheDocument();
    });

    test('should accept custom className for all card components', () => {
      render(
        <Card className="custom-card">
          <CardHeader className="custom-header">
            <CardTitle className="custom-title">Title</CardTitle>
          </CardHeader>
          <CardContent className="custom-content">Content</CardContent>
        </Card>
      );

      const card = screen.getByText('Title').closest('[data-slot="card"]');
      expect(card).toHaveClass('custom-card');
      
      const header = screen.getByText('Title').closest('[data-slot="card-header"]');
      expect(header).toHaveClass('custom-header');
      
      const title = screen.getByText('Title').closest('[data-slot="card-title"]');
      expect(title).toHaveClass('custom-title');
      
      const content = screen.getByText('Content').closest('[data-slot="card-content"]');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('Input Component', () => {
    test('should render input with default props', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      // Input component may not have explicit type attribute when default
      expect(input.tagName).toBe('INPUT');
    });

    test('should render input with different types', () => {
      const { rerender } = render(<Input type="email" />);
      let input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');

      rerender(<Input type="password" />);
      input = screen.getByDisplayValue('') || screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'password');

      rerender(<Input type="number" />);
      input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    test('should handle placeholder', () => {
      render(<Input placeholder="Enter text here" />);
      
      const input = screen.getByPlaceholderText('Enter text here');
      expect(input).toBeInTheDocument();
    });

    test('should handle disabled state', () => {
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    test('should accept custom className', () => {
      render(<Input className="custom-input" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input');
    });

    test('should handle value prop', () => {
      render(<Input value="test value" readOnly />);
      
      const input = screen.getByDisplayValue('test value');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Label Component', () => {
    test('should render label with text', () => {
      render(<Label>Test Label</Label>);
      
      const label = screen.getByText('Test Label');
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });

    test('should accept custom className', () => {
      render(<Label className="custom-label">Custom Label</Label>);
      
      const label = screen.getByText('Custom Label');
      expect(label).toHaveClass('custom-label');
    });

    test('should handle htmlFor attribute', () => {
      render(<Label htmlFor="test-input">Label for input</Label>);
      
      const label = screen.getByText('Label for input');
      expect(label).toHaveAttribute('for', 'test-input');
    });

    test('should work with Input component', () => {
      render(
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" />
        </div>
      );
      
      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox');
      
      expect(label).toHaveAttribute('for', 'email');
      expect(input).toHaveAttribute('id', 'email');
    });
  });

  describe('Alert Components', () => {
    test('should render alert with default variant', () => {
      render(
        <Alert>
          <AlertDescription>This is an alert message</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('This is an alert message')).toBeInTheDocument();
    });

    test('should render alert with destructive variant', () => {
      render(
        <Alert variant="destructive">
          <AlertDescription>This is a destructive alert</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('This is a destructive alert')).toBeInTheDocument();
    });

    test('should accept custom className', () => {
      render(
        <Alert className="custom-alert">
          <AlertDescription className="custom-description">
            Custom alert message
          </AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-alert');
      
      const description = screen.getByText('Custom alert message');
      expect(description).toHaveClass('custom-description');
    });

    test('should handle multiple alert descriptions', () => {
      render(
        <Alert>
          <AlertDescription>First message</AlertDescription>
          <AlertDescription>Second message</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('should render form with multiple UI components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Login Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter your password" />
              </div>
              <Button type="submit">Login</Button>
            </form>
          </CardContent>
        </Card>
      );

      // Check all components are rendered
      expect(screen.getByText('Login Form')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    test('should render alert card with button', () => {
      render(
        <Card>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                Something went wrong. Please try again.
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    test('should handle complex nested structure', () => {
      render(
        <div>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value="John Doe" readOnly />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value="john@example.com" readOnly />
                </div>
                <Alert>
                  <AlertDescription>
                    Your profile information is up to date.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button variant="default">Edit Profile</Button>
                  <Button variant="outline">Change Password</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

      // Verify all components are present and functional
      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Your profile information is up to date.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit Profile' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Change Password' })).toBeInTheDocument();
    });
  });
}); 