import { jest, describe, it, beforeEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import EmailTemplates from '../../pages/EmailTemplates';
import { supabase } from '@/supabase/supabaseClient';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { toast } from 'sonner';

// Mock supabase client
const mockQuery: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    then: jest.fn(),
};

jest.mock('@/supabase/supabaseClient', () => ({
    supabase: {
        from: jest.fn(() => mockQuery),
    },
}));

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...(jest.requireActual('react-router-dom') as any), // eslint-disable-line @typescript-eslint/no-explicit-any
    useNavigate: () => mockedNavigate,
}));

jest.mock('@/components/layout/Header', () => ({
    Header: ({ title }: { title: string }) => <div data-testid="header">{title}</div>,
}));

jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock TemplateForm
jest.mock('@/components/admin/TemplateForm', () => ({
    TemplateForm: () => <div data-testid="template-form">Template Form Mock</div>,
}));

// Mock antd
jest.mock('antd', () => {
  return {
    Dropdown: ({ children, menu }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
      <div data-testid="antd-dropdown">
        {children}
        <div data-testid="dropdown-menu">
          {menu?.items?.map((item: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
            <button key={item.key} onClick={item.onClick} data-testid={`menu-item-${item.key}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    ),
    Menu: ({ children }: any) => <div>{children}</div>, // eslint-disable-line @typescript-eslint/no-explicit-any
    Tabs: ({ items, onChange }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
      <div data-testid="antd-tabs">
        {items?.map((item: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
          <button
            key={item.key}
            onClick={() => onChange && onChange(item.key)}
            data-testid={`tab-${item.key}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    ),
    Modal: ({ children, open, title, onOk, onCancel }: any) => open ? ( // eslint-disable-line @typescript-eslint/no-explicit-any
      <div data-testid="antd-modal">
        <div>{title}</div>
        {children}
        <button onClick={onOk}>OK</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
    ConfigProvider: ({ children }: any) => children, // eslint-disable-line @typescript-eslint/no-explicit-any
    theme: {
      useToken: () => ({ token: {} }),
    },
  };
});

describe('EmailTemplates Component - Final Robust', () => {
    const mockTemplates = [
        {
            id: '1',
            name: 'Leads Template',
            subject: 'Lead Subject',
            body: '<p>Lead Content</p>',
            status: 'active',
            category: 'leads',
            created_at: new Date().toISOString(),
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        window.confirm = jest.fn(() => true);
        mockQuery.then.mockImplementation((onFulfilled: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            return Promise.resolve({ data: mockTemplates, error: null }).then(onFulfilled);
        });
    });

    it('renders and displays templates', async () => {
        render(
            <MemoryRouter>
                <EmailTemplates />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Leads Template')).toBeInTheDocument();
        });
    });

    it('navigates to create and edit pages', async () => {
        render(
            <MemoryRouter>
                <EmailTemplates />
            </MemoryRouter>
        );

        const newBtn = await screen.findByText(/New Template/i);
        fireEvent.click(newBtn);
        expect(mockedNavigate).toHaveBeenCalledWith('/campaigns/templates/create');

        await waitFor(() => expect(screen.getByText('Leads Template')).toBeInTheDocument());
        
        const editBtns = screen.getAllByText(/Edit Design/i);
        fireEvent.click(editBtns[0]);
        expect(mockedNavigate).toHaveBeenCalledWith('/campaigns/templates/edit/1');
    });

    it('handles template deletion', async () => {
        render(
            <MemoryRouter>
                <EmailTemplates />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Leads Template')).toBeInTheDocument());

        const deleteBtn = screen.getByTestId('menu-item-delete');
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(window.confirm).toHaveBeenCalled();
            expect(mockQuery.delete).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Template deleted successfully');
        });
    });
});
