import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "@/supabase/supabaseClient"

interface FileItem {
    name: string
    signedUrl: string
}

interface CustomerAttachmentsProps {
    customerId: string
}

const CustomerAttachments = ({ customerId }: CustomerAttachmentsProps) => {
    const [files, setFiles] = useState<FileItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchFiles = async () => {
            if (!customerId) return

            const { data, error } = await supabase.storage
                .from("Customer_attachments")
                .list(customerId)

            if (error) {
                console.error("List error:", error.message)
                return
            }

            const fileList = data.map((file) => {
                const { data: publicUrlData } = supabase.storage
                    .from("Customer_attachments")
                    .getPublicUrl(`${customerId}/${file.name}`)

                return {
                    name: file.name,
                    signedUrl: publicUrlData.publicUrl,
                }
            })

            setFiles(fileList)
            setLoading(false)
        }

        fetchFiles()
    }, [customerId])

    if (loading) return <p className="p-4">Loading...</p>

    return (
        <div className="p-4 max-h-[200px] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
                Customer Attachments
            </h2>

            {files.length === 0 ? (
                <p>No files found</p>
            ) : (
                <ul className="space-y-2">
                    {files.map((file, index) => (
                        <li key={index}>
                            <a
                                href={file.signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                            >
                                {file.name}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default CustomerAttachments