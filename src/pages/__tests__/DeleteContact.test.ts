import { deleteContactList } from "@/test/customer test/deleteContactList";

describe('deleteContactList', () => {
    it('deletes contact', () => {
        const contacts = [
            { id: 1, name: 'John' },
            { id: 2, name: 'Jane' },
        ];
        const result = deleteContactList(contacts, 1);
        expect(result).toEqual([{ id: 2, name: 'Jane' }]);
    })

    it('returns same list if id not found', () => {
        const contacts = [
            { id: 1, name: 'John' },
        ];
        const result = deleteContactList(contacts, 5);
        expect(result).toEqual(contacts);
    })
})