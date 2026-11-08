import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import EmailEditorReal, { EditorRef, EmailEditorProps as UnlayerProps } from 'react-email-editor';

interface EmailEditorProps {
    initialDesign?: any;
    onChange?: () => void;
}

export interface EmailEditorHandle {
    exportHtml: () => Promise<{ html: string; design: any }>;
}

export const EmailEditor = forwardRef<EmailEditorHandle, EmailEditorProps>(({ initialDesign, onChange }, ref) => {
    const emailEditorRef = useRef<EditorRef>(null);

    useImperativeHandle(ref, () => ({
        exportHtml: () => {
            return new Promise((resolve) => {
                if (!emailEditorRef.current) {
                    resolve({ html: '', design: null });
                    return;
                }

                emailEditorRef.current.editor.exportHtml((data: any) => {
                    const { design, html } = data;
                    resolve({ html, design });
                });
            });
        }
    }));

    const onReady: UnlayerProps['onReady'] = (unlayer) => {
        if (initialDesign) {
            unlayer.loadDesign(initialDesign);
        }
        
        // Listen for design changes
        unlayer.addEventListener('design:updated', () => {
            if (onChange) onChange();
        });
    };

    return (
        <div className="flex flex-1 bg-slate-100/50 overflow-hidden h-[calc(100vh-200px)] min-h-[600px] border rounded-xl shadow-inner">
            <EmailEditorReal
                ref={emailEditorRef}
                onReady={onReady}
                minHeight="100%"
                options={{
                    appearance: {
                        theme: 'modern',
                        panels: {
                            tools: {
                                dock: 'left'
                            }
                        }
                    },
                    features: {
                        textEditor: {
                            spellCheck: true
                        },
                        preview: true
                    }
                }}
            />
        </div>
    );
});

EmailEditor.displayName = 'EmailEditor';
