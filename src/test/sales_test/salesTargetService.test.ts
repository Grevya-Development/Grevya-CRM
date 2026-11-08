import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { salesTargetService } from '../../services/salesTargetService';
import { supabase } from '@/supabase/supabaseClient';

const mockQuery: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn((onFulfilled: any) => Promise.resolve({ data: null, error: null }).then(onFulfilled)),
};

jest.mock('@/supabase/supabaseClient', () => ({
    supabase: {
        from: jest.fn(() => mockQuery),
    },
}));

describe('salesTargetService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mockQuery methods to default behavior
        Object.keys(mockQuery).forEach(key => {
            if (jest.isMockFunction(mockQuery[key]) && key !== 'then') {
                mockQuery[key].mockReturnThis();
            }
        });
        mockQuery.then.mockImplementation((onFulfilled: any) => Promise.resolve({ data: null, error: null }).then(onFulfilled));
    });

    describe('getSalesTargets', () => {
        it('fetches and transforms sales targets data', async () => {
            const mockData = [
                {
                    id: '1',
                    name: 'Target 1',
                    team_id: 't1',
                    target_type: 'Revenue',
                    target_value: 1000,
                    team: { name: 'Team A' }
                }
            ];

            mockQuery.then.mockImplementationOnce((onFulfilled: any) =>
                Promise.resolve({ data: mockData, error: null }).then(onFulfilled)
            );

            const result = await salesTargetService.getSalesTargets();

            expect(supabase.from).toHaveBeenCalledWith('sales_targets');
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Target 1');
            expect(result[0].team_name).toBe('Team A');
        });

        it('handles null data returned from supabase', async () => {
            mockQuery.then.mockImplementationOnce((onFulfilled: any) =>
                Promise.resolve({ data: null, error: null }).then(onFulfilled)
            );

            const result = await salesTargetService.getSalesTargets();
            expect(result).toEqual([]);
        });

        it('throws error when data fetching fails', async () => {
            const mockError = new Error('Fetch failed');
            mockQuery.then.mockImplementationOnce((onFulfilled: any) =>
                Promise.resolve({ data: null, error: mockError }).then(onFulfilled)
            );

            await expect(salesTargetService.getSalesTargets()).rejects.toThrow('Fetch failed');
        });
    });

    describe('getSalesTargetById', () => {
        it('fetches a single target with team and members', async () => {
            const mockTarget = {
                id: '1',
                name: 'Target 1',
                team: {
                    name: 'Team A',
                    manager: { full_name: 'Manager X' }
                },
                members: [
                    {
                        id: 'm1',
                        user_id: 'u1',
                        target_value: 500,
                        profile: { full_name: 'Member 1' }
                    }
                ]
            };

            mockQuery.then.mockImplementationOnce((onFulfilled: any) =>
                Promise.resolve({ data: mockTarget, error: null }).then(onFulfilled)
            );

            const result = await salesTargetService.getSalesTargetById('1');

            expect(supabase.from).toHaveBeenCalledWith('sales_targets');
            expect(result.name).toBe('Target 1');
            expect(result.members).toHaveLength(1);
            expect(result.members![0].full_name).toBe('Member 1');
        });

        it('handles target with no members', async () => {
            const mockTarget = { id: '1', name: 'Target 1', team: null, members: null };
            mockQuery.then.mockImplementationOnce((onFulfilled: any) =>
                Promise.resolve({ data: mockTarget, error: null }).then(onFulfilled)
            );

            const result = await salesTargetService.getSalesTargetById('1');
            expect(result.members).toEqual([]);
            expect(result.team_name).toBeUndefined();
        });

        it('throws error when target not found or fetch fails', async () => {
            const mockError = new Error('Not found');
            mockQuery.then.mockImplementationOnce((onFulfilled: any) =>
                Promise.resolve({ data: null, error: mockError }).then(onFulfilled)
            );

            await expect(salesTargetService.getSalesTargetById('1')).rejects.toThrow('Not found');
        });
    });

    describe('createSalesTarget', () => {
        it('inserts a new target and its member breakdown', async () => {
            const targetData = { name: 'New Target', target_value: 2000 };
            const members = [{ user_id: 'u1', target_value: 2000 }];

            mockQuery.then
                .mockImplementationOnce((onFulfilled: any) =>
                    Promise.resolve({ data: { id: 'new-id' }, error: null }).then(onFulfilled)
                )
                .mockImplementationOnce((onFulfilled: any) =>
                    Promise.resolve({ data: null, error: null }).then(onFulfilled)
                );

            await salesTargetService.createSalesTarget(targetData, members);

            expect(mockQuery.insert).toHaveBeenCalledTimes(2);
            expect(supabase.from).toHaveBeenCalledWith('sales_targets');
            expect(supabase.from).toHaveBeenCalledWith('sales_target_members');
        });

        it('throws error when target insertion fails', async () => {
            mockQuery.then.mockImplementationOnce((onFulfilled: any) =>
                Promise.resolve({ data: null, error: new Error('Insert failed') }).then(onFulfilled)
            );

            await expect(salesTargetService.createSalesTarget({}, [])).rejects.toThrow('Insert failed');
        });

        it('throws error when member insertion fails', async () => {
            mockQuery.then
                .mockImplementationOnce((onFulfilled: any) =>
                    Promise.resolve({ data: { id: 'new-id' }, error: null }).then(onFulfilled)
                )
                .mockImplementationOnce((onFulfilled: any) =>
                    Promise.resolve({ data: null, error: new Error('Members failed') }).then(onFulfilled)
                );

            await expect(salesTargetService.createSalesTarget({}, [{ user_id: 'u1' }])).rejects.toThrow('Members failed');
        });
    });

    describe('updateSalesTarget', () => {
        it('updates target and refreshes member breakdown', async () => {
            const id = '1';
            const targetData = { name: 'Updated Target' };
            const members = [{ user_id: 'u1', target_value: 1000 }];

            mockQuery.then.mockImplementation((onFulfilled: any) =>
                Promise.resolve({ data: null, error: null }).then(onFulfilled)
            );

            await salesTargetService.updateSalesTarget(id, targetData, members);

            expect(mockQuery.update).toHaveBeenCalled();
            expect(mockQuery.delete).toHaveBeenCalled();
            expect(mockQuery.insert).toHaveBeenCalled();
            expect(mockQuery.eq).toHaveBeenCalledWith('id', id);
            expect(mockQuery.eq).toHaveBeenCalledWith('target_id', id);
        });

        it('updates target without members', async () => {
            await salesTargetService.updateSalesTarget('1', {}, []);
            expect(mockQuery.update).toHaveBeenCalled();
            expect(mockQuery.delete).toHaveBeenCalled();
            expect(mockQuery.insert).not.toHaveBeenCalled();
        });

        it('throws error when target update fails', async () => {
            mockQuery.then.mockImplementationOnce((onFulfilled: any) =>
                Promise.resolve({ data: null, error: new Error('Update failed') }).then(onFulfilled)
            );

            await expect(salesTargetService.updateSalesTarget('1', {}, [])).rejects.toThrow('Update failed');
        });

        it('throws error when member deletion fails', async () => {
            mockQuery.then
                .mockImplementationOnce((onFulfilled: any) =>
                    Promise.resolve({ data: null, error: null }).then(onFulfilled)
                )
                .mockImplementationOnce((onFulfilled: any) =>
                    Promise.resolve({ data: null, error: new Error('Delete failed') }).then(onFulfilled)
                );

            await expect(salesTargetService.updateSalesTarget('1', {}, [])).rejects.toThrow('Delete failed');
        });

        it('throws error when member insertion fails', async () => {
            mockQuery.then
                .mockImplementationOnce((onFulfilled: any) =>
                    Promise.resolve({ data: null, error: null }).then(onFulfilled)
                )
                .mockImplementationOnce((onFulfilled: any) =>
                    Promise.resolve({ data: null, error: null }).then(onFulfilled)
                )
                .mockImplementationOnce((onFulfilled: any) =>
                    Promise.resolve({ data: null, error: new Error('Insert members failed') }).then(onFulfilled)
                );

            await expect(salesTargetService.updateSalesTarget('1', {}, [{ user_id: 'u1' }])).rejects.toThrow('Insert members failed');
        });
    });

    describe('updateSalesTargetMember', () => {
        it('updates an individual member target value', async () => {
            mockQuery.then.mockImplementationOnce((onFulfilled: any) =>
                Promise.resolve({ data: null, error: null }).then(onFulfilled)
            );

            await salesTargetService.updateSalesTargetMember('m1', 1500);

            expect(mockQuery.update).toHaveBeenCalledWith({ target_value: 1500 });
            expect(mockQuery.eq).toHaveBeenCalledWith('id', 'm1');
        });

        it('throws error when member update fails', async () => {
            mockQuery.then.mockImplementationOnce((onFulfilled: any) =>
                Promise.resolve({ data: null, error: new Error('Update failed') }).then(onFulfilled)
            );

            await expect(salesTargetService.updateSalesTargetMember('m1', 1500)).rejects.toThrow('Update failed');
        });
    });
});
