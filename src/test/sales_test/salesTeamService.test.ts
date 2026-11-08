import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { salesTeamService } from '../../services/salesTeamService';
import { supabase } from '@/supabase/supabaseClient';

const mockQuery: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn(),
};

jest.mock('@/supabase/supabaseClient', () => ({
    supabase: {
        from: jest.fn(() => mockQuery),
        auth: {
            getUser: jest.fn(),
        },
        rpc: jest.fn(),
    },
}));

describe('salesTeamService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getSalesTeams', () => {
        it('fetches and transforms sales teams data', async () => {
            const mockData = [
                {
                    id: '1',
                    name: 'Team A',
                    manager_id: 'm1',
                    status: 'Active',
                    created_at: '2023-01-01',
                    manager: { full_name: 'Manager A', avatar_url: 'url-m' },
                    members: [
                        { user_id: 'u1', crm_profile: { full_name: 'User 1', avatar_url: 'url-1' } }
                    ]
                }
            ];

            mockQuery.then.mockImplementation((onFulfilled: any) => {
                return Promise.resolve({ data: mockData, error: null }).then(onFulfilled);
            });

            const result = await salesTeamService.getSalesTeams();

            expect(supabase.from).toHaveBeenCalledWith('sales_teams');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Team A');
            expect(result[0].members[0].full_name).toBe('User 1');
        });
    });

    describe('createSalesTeam', () => {
        it('creates a team and its members', async () => {
            const mockTeam = { id: 'team-1', name: 'New Team' };
            const memberIds = ['u1', 'u2'];

            mockQuery.then.mockImplementationOnce((onFulfilled: any) => {
                return Promise.resolve({ data: mockTeam, error: null }).then(onFulfilled);
            });
            mockQuery.then.mockImplementationOnce((onFulfilled: any) => {
                return Promise.resolve({ data: null, error: null }).then(onFulfilled);
            });

            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'admin' } }, error: null });

            const result = await salesTeamService.createSalesTeam({ name: 'New Team', manager_id: 'm1' }, memberIds);

            expect(supabase.from).toHaveBeenCalledWith('sales_teams');
            expect(mockQuery.insert).toHaveBeenCalledWith({
                name: 'New Team',
                manager_id: 'm1',
                status: 'Active'
            });
            expect(result.id).toBe('team-1');
        });

        it('throws error for duplicate team name', async () => {
            mockQuery.then.mockImplementationOnce((onFulfilled: any) => {
                return Promise.resolve({ data: null, error: { code: '23505' } }).then(onFulfilled);
            });

            await expect(salesTeamService.createSalesTeam({ name: 'Dup' }, []))
                .rejects.toThrow('A sales team with this name already exists.');
        });
    });

    describe('updateSalesTeam', () => {
        it('updates team details and members', async () => {
            mockQuery.then.mockImplementation((onFulfilled: any) => {
                return Promise.resolve({ data: null, error: null }).then(onFulfilled);
            });

            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'admin' } }, error: null });

            await salesTeamService.updateSalesTeam('t1', { name: 'Updated' }, ['u3']);

            expect(mockQuery.update).toHaveBeenCalled();
            expect(mockQuery.delete).toHaveBeenCalledWith();
            expect(mockQuery.eq).toHaveBeenCalledWith('team_id', 't1');
        });
    });

    describe('toggleTeamStatus', () => {
        it('updates team status', async () => {
            mockQuery.then.mockImplementation((onFulfilled: any) => {
                return Promise.resolve({ data: null, error: null }).then(onFulfilled);
            });

            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'admin' } }, error: null });

            await salesTeamService.toggleTeamStatus('t1', 'Inactive');

            expect(mockQuery.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'Inactive' }));
        });
    });

    describe('getAllUsers', () => {
        it('returns users with profiles', async () => {
            const mockAuthUsers = [{ id: '1', email: 'u1@ex.com' }, { id: '2', email: 'u2@ex.com' }];
            const mockProfiles = [{ id: '1', full_name: 'User 1' }];

            (supabase.rpc as any).mockResolvedValue({ data: mockAuthUsers, error: null });
            mockQuery.then.mockImplementation((onFulfilled: any) => {
                return Promise.resolve({ data: mockProfiles, error: null }).then(onFulfilled);
            });

            const result = await salesTeamService.getAllUsers();

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
            expect(result[0].full_name).toBe('User 1');
        });
    });
});
