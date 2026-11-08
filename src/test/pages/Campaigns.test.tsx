import { jest, describe, it, beforeEach } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Campaigns from '../../pages/Campaigns';
import { campaignService } from '@/services/campaignService';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock the services and hooks
jest.mock('@/services/campaignService', () => ({
    campaignService: {
        getCampaigns: jest.fn(),
    },
}));

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...(jest.requireActual('react-router-dom') as any), // eslint-disable-line @typescript-eslint/no-explicit-any
    useNavigate: () => mockedNavigate,
}));

// Mock Header component
jest.mock('@/components/layout/Header', () => ({
    Header: ({ title }: { title: string }) => <div data-testid="header">{title}</div>,
}));

// Mocking Select with explicit data-testids for items
jest.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
    <div data-testid="select-mock" onClick={(e: any) => onValueChange && onValueChange(e.target.value)}>{children}</div> // eslint-disable-line @typescript-eslint/no-explicit-any
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>, // eslint-disable-line @typescript-eslint/no-explicit-any
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>, // eslint-disable-line @typescript-eslint/no-explicit-any
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>, // eslint-disable-line @typescript-eslint/no-explicit-any
  SelectItem: ({ children, value }: any) => <button value={value} data-testid={`select-item-${value}`}>{children}</button>, // eslint-disable-line @typescript-eslint/no-explicit-any
}));

describe('Campaigns Component - Final Robust', () => {
    const mockCampaigns = [
        {
            id: '1',
            name: 'Draft Campaign',
            description: 'Draft Description',
            status: 'draft',
            created_at: new Date().toISOString(),
            segment: { name: 'Segment A' },
        },
        {
            id: '2',
            name: 'Sent Campaign',
            description: 'Sent Description',
            status: 'sent',
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
            delivered_rate: 95,
            open_rate: 45,
            click_rate: 10,
            segment_id: 'all_contacts',
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (campaignService.getCampaigns as any).mockResolvedValue(mockCampaigns); // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    it('renders and displays campaigns with status badges', async () => {
        render(
            <MemoryRouter>
                <Campaigns />
            </MemoryRouter>
        );

        expect(screen.getByTestId('header')).toHaveTextContent('All Campaigns');
        
        await waitFor(() => {
            expect(screen.getByText('Draft Campaign')).toBeInTheDocument();
            expect(screen.getByText('Sent Campaign')).toBeInTheDocument();
        });

        // Use getAllByText for badges because "Draft" also appears in Select
        const draftBadges = screen.getAllByText('Draft');
        expect(draftBadges.length).toBeGreaterThan(0);
        
        const sendBadges = screen.getAllByText('Send');
        expect(sendBadges.length).toBeGreaterThan(0);
    });

    it('filters campaigns by search term', async () => {
        render(
            <MemoryRouter>
                <Campaigns />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Draft Campaign')).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText('Search campaigns');
        fireEvent.change(searchInput, { target: { value: 'Sent' } });

        expect(screen.getByText('Sent Campaign')).toBeInTheDocument();
        expect(screen.queryByText('Draft Campaign')).not.toBeInTheDocument();
    });

    it('filters campaigns by status', async () => {
        render(
            <MemoryRouter>
                <Campaigns />
            </MemoryRouter>
        );

        await waitFor(() => expect(screen.getByText('Draft Campaign')).toBeInTheDocument());

        const sentOption = screen.getByTestId('select-item-sent');
        fireEvent.click(sentOption);

        expect(screen.getByText('Sent Campaign')).toBeInTheDocument();
        expect(screen.queryByText('Draft Campaign')).not.toBeInTheDocument();
    });

    it('navigates to create page', () => {
        render(
            <MemoryRouter>
                <Campaigns />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('New Campaign'));
        expect(mockedNavigate).toHaveBeenCalledWith('/campaigns/create');
    });
});
