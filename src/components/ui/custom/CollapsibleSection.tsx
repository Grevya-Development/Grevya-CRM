import React, { useState } from 'react';
import { Card, Button } from 'antd';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';

interface CollapsibleSectionProps {
    title: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
    icon?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    children,
    defaultOpen = true,
    className,
    icon
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Card
            className={`shadow-sm mb-4 border-slate-200 ${className || ''}`}
            bordered={false}
            bodyStyle={{
                padding: isOpen ? '24px' : '0px',
                display: isOpen ? 'block' : 'none',
                transition: 'all 0.3s ease'
            }}
            title={
                <div
                    className="flex items-center gap-2 select-none"
                onClick={() => setIsOpen(!isOpen)} 
                >
                    {icon && <span className="text-slate-500 flex items-center">{icon}</span>}
                    <span className="text-base font-semibold text-slate-700">{title}</span>
                </div>
            }
            extra={
                <Button
                    type="text"
                    shape="circle"
                    icon={isOpen ? <MinusOutlined /> : <PlusOutlined />}
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-slate-400 hover:text-slate-600 bg-slate-50"
                />
            }
        >
            {children}
        </Card>
    );
};
