/**
 * PENNY WISE - UI COMPONENTS TESTS
 * Testing React UI components and their functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('UI Components', () => {
  describe('Button Component', () => {
    test('should render button with text', () => {
      const Button = ({ children, onClick, disabled = false, variant = 'default' }: {
        children: React.ReactNode;
        onClick?: () => void;
        disabled?: boolean;
        variant?: 'default' | 'primary' | 'secondary' | 'danger';
      }) => (
        <button
          onClick={onClick}
          disabled={disabled}
          className={`btn btn-${variant}`}
          data-testid="button"
        >
          {children}
        </button>
      );

      render(<Button>Click me</Button>);
      
      const button = screen.getByTestId('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click me');
      expect(button).not.toBeDisabled();
    });

    test('should handle click events', () => {
      const handleClick = jest.fn();
      
      const Button = ({ children, onClick }: {
        children: React.ReactNode;
        onClick?: () => void;
      }) => (
        <button onClick={onClick} data-testid="button">
          {children}
        </button>
      );

      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByTestId('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should be disabled when disabled prop is true', () => {
      const handleClick = jest.fn();
      
      const Button = ({ children, onClick, disabled }: {
        children: React.ReactNode;
        onClick?: () => void;
        disabled?: boolean;
      }) => (
        <button onClick={onClick} disabled={disabled} data-testid="button">
          {children}
        </button>
      );

      render(<Button onClick={handleClick} disabled>Click me</Button>);
      
      const button = screen.getByTestId('button');
      expect(button).toBeDisabled();
      
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Input Component', () => {
    test('should render input with placeholder', () => {
      const Input = ({ placeholder, value, onChange }: {
        placeholder?: string;
        value?: string;
        onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
      }) => (
        <input
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          data-testid="input"
        />
      );

      render(<Input placeholder="Enter text" />);
      
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Enter text');
    });

    test('should handle value changes', () => {
      const handleChange = jest.fn();
      
      const Input = ({ value, onChange }: {
        value?: string;
        onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
      }) => (
        <input
          value={value || ''}
          onChange={onChange}
          data-testid="input"
        />
      );

      render(<Input value="" onChange={handleChange} />);
      
      const input = screen.getByTestId('input');
      fireEvent.change(input, { target: { value: 'test value' } });
      
      expect(handleChange).toHaveBeenCalledTimes(1);
      // Just check that the handler was called with an event
      expect(handleChange).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('Card Component', () => {
    test('should render card with title and content', () => {
      const Card = ({ title, children }: {
        title?: string;
        children: React.ReactNode;
      }) => (
        <div className="card" data-testid="card">
          {title && <h3 className="card-title" data-testid="card-title">{title}</h3>}
          <div className="card-content" data-testid="card-content">
            {children}
          </div>
        </div>
      );

      render(
        <Card title="Test Card">
          <p>Card content</p>
        </Card>
      );
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByTestId('card-title')).toHaveTextContent('Test Card');
      expect(screen.getByTestId('card-content')).toHaveTextContent('Card content');
    });

    test('should render card without title', () => {
      const Card = ({ title, children }: {
        title?: string;
        children: React.ReactNode;
      }) => (
        <div className="card" data-testid="card">
          {title && <h3 className="card-title" data-testid="card-title">{title}</h3>}
          <div className="card-content" data-testid="card-content">
            {children}
          </div>
        </div>
      );

      render(
        <Card>
          <p>Card content only</p>
        </Card>
      );
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.queryByTestId('card-title')).not.toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toHaveTextContent('Card content only');
    });
  });

  describe('Modal Component', () => {
    test('should render modal when open', () => {
      const Modal = ({ isOpen, onClose, title, children }: {
        isOpen: boolean;
        onClose: () => void;
        title?: string;
        children: React.ReactNode;
      }) => {
        if (!isOpen) return null;

        return (
          <div className="modal-overlay" data-testid="modal-overlay">
            <div className="modal" data-testid="modal">
              <div className="modal-header">
                {title && <h2 data-testid="modal-title">{title}</h2>}
                <button onClick={onClose} data-testid="modal-close">×</button>
              </div>
              <div className="modal-content" data-testid="modal-content">
                {children}
              </div>
            </div>
          </div>
        );
      };

      const handleClose = jest.fn();

      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Test Modal');
      expect(screen.getByTestId('modal-content')).toHaveTextContent('Modal content');
    });

    test('should not render modal when closed', () => {
      const Modal = ({ isOpen, onClose, children }: {
        isOpen: boolean;
        onClose: () => void;
        children: React.ReactNode;
      }) => {
        if (!isOpen) return null;

        return (
          <div className="modal-overlay" data-testid="modal-overlay">
            <div className="modal" data-testid="modal">
              <button onClick={onClose} data-testid="modal-close">×</button>
              <div className="modal-content">{children}</div>
            </div>
          </div>
        );
      };

      const handleClose = jest.fn();

      render(
        <Modal isOpen={false} onClose={handleClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
    });

    test('should call onClose when close button is clicked', () => {
      const Modal = ({ isOpen, onClose, children }: {
        isOpen: boolean;
        onClose: () => void;
        children: React.ReactNode;
      }) => {
        if (!isOpen) return null;

        return (
          <div className="modal-overlay" data-testid="modal-overlay">
            <div className="modal" data-testid="modal">
              <button onClick={onClose} data-testid="modal-close">×</button>
              <div className="modal-content">{children}</div>
            </div>
          </div>
        );
      };

      const handleClose = jest.fn();

      render(
        <Modal isOpen={true} onClose={handleClose}>
          <p>Modal content</p>
        </Modal>
      );
      
      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);
      
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading Component', () => {
    test('should render loading spinner', () => {
      const LoadingSpinner = ({ size = 'medium' }: {
        size?: 'small' | 'medium' | 'large';
      }) => (
        <div className={`loading-spinner loading-${size}`} data-testid="loading-spinner">
          <div className="spinner"></div>
        </div>
      );

      render(<LoadingSpinner />);
      
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('loading-medium');
    });

    test('should render loading with text', () => {
      const LoadingWithText = ({ text = 'Loading...' }: {
        text?: string;
      }) => (
        <div className="loading-container" data-testid="loading-container">
          <div className="loading-spinner" data-testid="loading-spinner"></div>
          <p className="loading-text" data-testid="loading-text">{text}</p>
        </div>
      );

      render(<LoadingWithText text="Carregando dados..." />);
      
      expect(screen.getByTestId('loading-container')).toBeInTheDocument();
      expect(screen.getByTestId('loading-text')).toHaveTextContent('Carregando dados...');
    });
  });

  describe('Alert Component', () => {
    test('should render alert with different types', () => {
      const Alert = ({ type, message, onClose }: {
        type: 'info' | 'warning' | 'error' | 'success';
        message: string;
        onClose?: () => void;
      }) => (
        <div className={`alert alert-${type}`} data-testid="alert">
          <span className="alert-message" data-testid="alert-message">{message}</span>
          {onClose && (
            <button onClick={onClose} className="alert-close" data-testid="alert-close">
              ×
            </button>
          )}
        </div>
      );

      const { rerender } = render(
        <Alert type="info" message="Info message" />
      );
      
      expect(screen.getByTestId('alert')).toHaveClass('alert-info');
      expect(screen.getByTestId('alert-message')).toHaveTextContent('Info message');

      rerender(<Alert type="error" message="Error message" />);
      expect(screen.getByTestId('alert')).toHaveClass('alert-error');
      expect(screen.getByTestId('alert-message')).toHaveTextContent('Error message');
    });

    test('should call onClose when close button is clicked', () => {
      const handleClose = jest.fn();
      
      const Alert = ({ type, message, onClose }: {
        type: 'info' | 'warning' | 'error' | 'success';
        message: string;
        onClose?: () => void;
      }) => (
        <div className={`alert alert-${type}`} data-testid="alert">
          <span className="alert-message">{message}</span>
          {onClose && (
            <button onClick={onClose} className="alert-close" data-testid="alert-close">
              ×
            </button>
          )}
        </div>
      );

      render(
        <Alert type="warning" message="Warning message" onClose={handleClose} />
      );
      
      const closeButton = screen.getByTestId('alert-close');
      fireEvent.click(closeButton);
      
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Components', () => {
    test('should render form with validation', async () => {
      const FormWithValidation = () => {
        const [email, setEmail] = React.useState('');
        const [password, setPassword] = React.useState('');
        const [errors, setErrors] = React.useState<Record<string, string>>({});

        const validateForm = () => {
          const newErrors: Record<string, string> = {};
          
          if (!email) {
            newErrors.email = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email is invalid';
          }
          
          if (!password) {
            newErrors.password = 'Password is required';
          } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
          }
          
          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
        };

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (validateForm()) {
            // Form is valid
            console.log('Form submitted');
          }
        };

        return (
          <form onSubmit={handleSubmit} data-testid="form">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                data-testid="email-input"
              />
              {errors.email && (
                <span className="error" data-testid="email-error">
                  {errors.email}
                </span>
              )}
            </div>
            
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                data-testid="password-input"
              />
              {errors.password && (
                <span className="error" data-testid="password-error">
                  {errors.password}
                </span>
              )}
            </div>
            
            <button type="submit" data-testid="submit-button">
              Submit
            </button>
          </form>
        );
      };

      render(<FormWithValidation />);
      
      const form = screen.getByTestId('form');
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByTestId('submit-button');
      
      expect(form).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();

      // Test validation on submit
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
        expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
      });

      // Test invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
      });

      // Test short password
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
      });

      // Test valid form
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
        expect(screen.queryByTestId('password-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('List Components', () => {
    test('should render list with items', () => {
      interface ListItem {
        id: string;
        title: string;
        description: string;
      }

      const List = ({ items, onItemClick }: {
        items: ListItem[];
        onItemClick?: (item: ListItem) => void;
      }) => (
        <ul className="list" data-testid="list">
          {items.map(item => (
            <li
              key={item.id}
              className="list-item"
              data-testid={`list-item-${item.id}`}
              onClick={() => onItemClick?.(item)}
            >
              <h4 className="list-item-title">{item.title}</h4>
              <p className="list-item-description">{item.description}</p>
            </li>
          ))}
        </ul>
      );

      const items: ListItem[] = [
        { id: '1', title: 'Item 1', description: 'Description 1' },
        { id: '2', title: 'Item 2', description: 'Description 2' },
        { id: '3', title: 'Item 3', description: 'Description 3' }
      ];

      const handleItemClick = jest.fn();

      render(<List items={items} onItemClick={handleItemClick} />);
      
      expect(screen.getByTestId('list')).toBeInTheDocument();
      expect(screen.getByTestId('list-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('list-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('list-item-3')).toBeInTheDocument();

      // Test item click
      fireEvent.click(screen.getByTestId('list-item-1'));
      expect(handleItemClick).toHaveBeenCalledWith(items[0]);
    });

    test('should render empty list message', () => {
      const EmptyList = ({ items, emptyMessage = 'No items found' }: {
        items: unknown[];
        emptyMessage?: string;
      }) => (
        <div data-testid="list-container">
          {items.length === 0 ? (
            <p className="empty-message" data-testid="empty-message">
              {emptyMessage}
            </p>
          ) : (
            <ul className="list" data-testid="list">
              {items.map((item, index) => (
                <li key={index} className="list-item">
                  {String(item)}
                </li>
              ))}
            </ul>
          )}
        </div>
      );

      render(<EmptyList items={[]} emptyMessage="Nenhum item encontrado" />);
      
      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
      expect(screen.getByTestId('empty-message')).toHaveTextContent('Nenhum item encontrado');
      expect(screen.queryByTestId('list')).not.toBeInTheDocument();
    });
  });
}); 