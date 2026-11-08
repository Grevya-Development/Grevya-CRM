export const updateContactInList = (
    contacts: any[],
    updatedContact: any
) => {
    return contacts.map(c =>
        c.id === updatedContact.id ? updatedContact : c
    );
};