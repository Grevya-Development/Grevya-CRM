import { updateContactInList } from '../../test/customer test/updateContactInList'

describe('updateContactInList', () => {

    it('updates matching contact', () => {
        const contacts = [
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' },
        ];

        const updated = { id: 1, name: 'John Updated' };

        const result = updateContactInList(contacts, updated);

        expect(result).toEqual([
            { id: 1, name: 'John Updated' },
            { id: 2, name: 'Jane' },
        ]);
    });

    it('returns same list if id not found', () => {
        const contacts = [
            { id: 1, name: 'John' },
        ];

        const updated = { id: 5, name: 'Someone' };

        const result = updateContactInList(contacts, updated);

        expect(result).toEqual(contacts);
    });

});