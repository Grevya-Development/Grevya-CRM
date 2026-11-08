import React, { useState } from 'react';
import { Modal, Input } from 'antd';

const { TextArea } = Input;

interface LostReasonModalProps {
    open: boolean;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
    loading?: boolean;
}

export const LostReasonModal: React.FC<LostReasonModalProps> = ({
    open,
    onConfirm,
    onCancel,
    loading = false,
}) => {
    const [reason, setReason] = useState('');

    const handleOk = () => {
        if (!reason.trim()) {
            return;
        }
        onConfirm(reason);
        setReason('');
    };

    const handleCancel = () => {
        setReason('');
        onCancel();
    };

    return (
        <Modal
            title="Reason for Lost Lead"
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            confirmLoading={loading}
            okText="Submit"
            cancelText="Cancel"
            okButtonProps={{ disabled: !reason.trim() }}
            destroyOnClose
        >
            <div className="py-2">
                <p className="text-sm text-slate-500 mb-4">
                    Please provide a reason why this lead was marked as lost. This information helps us improve our sales process.
                </p>
                <TextArea
                    rows={4}
                    placeholder="Enter reason here..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="rounded-md"
                />
            </div>
        </Modal>
    );
};
