import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Contacts from '../Contacts';
import { supabase } from '@/supabase/supabaseClient';
import { MemoryRouter } from 'react-router-dom';
import * as ExcelJS from 'exceljs';
import '@testing-library/jest-dom';
import { LayoutProvider } from '@/contexts/LayoutContext';

const mockQuery: any = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn(),
};

jest.mock('@/supabase/supabaseClient', () => ({
    supabase: {
        from: jest.fn(() => mockQuery),
        // The page header loads the signed-in user's profile.
        auth: {
            getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        },
    },
}));

const mockWorksheet: any = {
    addRow: jest.fn(),
    eachRow: jest.fn(),
    columns: [],
};

const mockWorkbook: any = {
    addWorksheet: jest.fn(() => mockWorksheet),
    csv: {
        writeBuffer: jest.fn<() => Promise<Uint8Array>>().mockResolvedValue(new Uint8Array()),
    },
    xlsx: {
        writeBuffer: jest.fn<() => Promise<Uint8Array>>().mockResolvedValue(new Uint8Array()),
    },
};

jest.mock('exceljs', () => ({
    Workbook: jest.fn(() => mockWorkbook),
}));

// emailService reads import.meta.env, which Jest can't parse.
jest.mock('@/services/emailService', () => ({
    emailService: { sendEmail: jest.fn() },
}));

jest.mock('sonner', () => ({
    toast: {
        info: jest.fn(),
        success: jest.fn(),
        error: jest.fn(),
    },
}));

global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('Contacts Export Functionality', () => {
    const mockContacts = [
        {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            mobile_no: '1234567890',
            designation: 'Manager',
            customer: { name: 'Acme Corp' },
            created_at: new Date().toISOString(),
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery.then.mockImplementation((onFulfilled: any) => {
            return Promise.resolve({ data: mockContacts, error: null }).then(onFulfilled);
        });
    });

    it('performs full export when no filter is applied', async () => {
        render(
            <LayoutProvider>
                <MemoryRouter>
                    <Contacts />
                </MemoryRouter>
            </LayoutProvider>
        );

        fireEvent.keyDown(screen.getByRole('button', { name: 'Export Contacts' }), { key: 'Enter' });
        fireEvent.click(screen.getByText('CSV'));

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('crm_contacts');
            expect(mockQuery.limit).not.toHaveBeenCalled();
        });

        expect(ExcelJS.Workbook).toHaveBeenCalled();
        expect(mockWorksheet.addRow).toHaveBeenCalled();
    });

    it('performs filtered export when search is active', async () => {
        render(
            <LayoutProvider>
                <MemoryRouter>
                    <Contacts />
                </MemoryRouter>
            </LayoutProvider>
        );

        // Wait for the contact list to load before filtering and exporting.
        await screen.findAllByText('John Doe');

        fireEvent.change(
            screen.getByPlaceholderText('Search customers...'),
            { target: { value: 'John' } }
        );

        fireEvent.keyDown(screen.getByRole('button', { name: 'Export Contacts' }), { key: 'Enter' });
        fireEvent.click(screen.getByText('CSV'));

        await waitFor(() => {
            expect(mockWorksheet.addRow).toHaveBeenCalled();
        });
    });

    it('handles export failure gracefully', async () => {
        mockQuery.then.mockImplementationOnce((onFulfilled: any) => {
            return Promise.resolve({ data: null, error: new Error('DB error') }).then(onFulfilled);
        });

        render(
            <LayoutProvider>
                <MemoryRouter>
                    <Contacts />
                </MemoryRouter>
            </LayoutProvider>
        );

        fireEvent.keyDown(screen.getByRole('button', { name: 'Export Contacts' }), { key: 'Enter' });
        fireEvent.click(screen.getByText('CSV'));

        await waitFor(() => {
            expect(mockWorksheet.addRow).not.toHaveBeenCalled();
        });
    });
});