import axios from "axios"
import { useState } from "react"

const API = "http://localhost:3000"

export function Upload(){
    const [title, setTitle] = useState("")
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
    const [status, setStatus] = useState("")
    const [uploading, setUploading] = useState(false)

    // Asks the backend for a presigned URL, PUTs the file straight to R2,
    // and returns the public URL the file will live at.
    async function uploadToR2(file: File, kind: "video" | "thumbnail"): Promise<string> {
        const token = localStorage.getItem("token")
        const { data } = await axios.post(`${API}/api/upload-url`, {
            fileName: file.name,
            contentType: file.type,
            kind,
        }, {
            headers: { Authorization: `Bearer ${token}` }
        })

        await axios.put(data.uploadUrl, file, {
            headers: { "Content-Type": file.type }
        })

        return data.publicUrl
    }

    async function upload(){
        if (!title || !videoFile || !thumbnailFile) {
            setStatus("Please add a title, a video file, and a thumbnail.")
            return
        }
        try {
            setUploading(true)
            setStatus("Uploading video…")
            const videoUrl = await uploadToR2(videoFile, "video")

            setStatus("Uploading thumbnail…")
            const thumbnail = await uploadToR2(thumbnailFile, "thumbnail")

            setStatus("Saving…")
            await axios.post(`${API}/api/videos`, { title, videoUrl, thumbnail }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })

            window.location.href = "/"
        } catch (err: any) {
            setStatus("Upload failed: " + (err.response?.data?.message || err.message))
            setUploading(false)
        }
    }

    return <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 20, maxWidth: 400 }}>
        <input
            type="text"
            placeholder="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
        />
        <label>Video<br/>
            <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
        </label>
        <label>Thumbnail<br/>
            <input type="file" accept="image/*" onChange={e => setThumbnailFile(e.target.files?.[0] ?? null)} />
        </label>
        <button onClick={upload} disabled={uploading}>
            {uploading ? "Uploading…" : "Complete upload"}
        </button>
        {status && <div>{status}</div>}
    </div>
}
