export const deleteContactList = (
    contacts: any[],
    id: number
) => {
    return contacts.filter(c => c.id !== id);
};