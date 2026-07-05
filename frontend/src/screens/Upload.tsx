import axios from "axios";
import { useState } from "react";
import { API_URL as API } from "../config";

export function Upload() {
    const [title, setTitle] = useState("");
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [status, setStatus] = useState("");
    const [isError, setIsError] = useState(false);
    const [uploading, setUploading] = useState(false);

    async function uploadToR2(file: File, kind: "video" | "thumbnail"): Promise<string> {
        const token = localStorage.getItem("token");
        const { data } = await axios.post(`${API}/api/upload-url`, {
            fileName: file.name,
            contentType: file.type,
            kind,
        }, { headers: { Authorization: `Bearer ${token}` } });

        await axios.put(data.uploadUrl, file, {
            headers: { "Content-Type": file.type },
        });

        return data.publicUrl;
    }

    async function upload() {
        if (!title || !videoFile || !thumbnailFile) {
            setIsError(true);
            setStatus("Please add a title, a video file, and a thumbnail.");
            return;
        }
        try {
            setUploading(true);
            setIsError(false);

            setStatus("Uploading video…");
            const videoUrl = await uploadToR2(videoFile, "video");

            setStatus("Uploading thumbnail…");
            const thumbnail = await uploadToR2(thumbnailFile, "thumbnail");

            setStatus("Saving…");
            await axios.post(`${API}/api/videos`, { title, videoUrl, thumbnail }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            window.location.href = "/";
        } catch (err: any) {
            setIsError(true);
            setStatus("Upload failed: " + (err.response?.data?.message || err.message));
            setUploading(false);
        }
    }

    return (
        <div className="upload-page">
            <div className="upload-container">
                <div className="auth-title" style={{ marginBottom: 4 }}>Upload video</div>
                <div className="auth-subtitle">Share your video with the world</div>

                <div className="form-group">
                    <label className="form-label">Title</label>
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Enter video title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Video file</label>
                    <input
                        className="form-input"
                        type="file"
                        accept="video/*"
                        onChange={e => setVideoFile(e.target.files?.[0] ?? null)}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Thumbnail image</label>
                    <input
                        className="form-input"
                        type="file"
                        accept="image/*"
                        onChange={e => setThumbnailFile(e.target.files?.[0] ?? null)}
                    />
                </div>

                <button className="btn-primary" style={{ width: "100%" }} onClick={upload} disabled={uploading}>
                    {uploading ? status : "Upload"}
                </button>

                {status && !uploading && (
                    <div className={`upload-status ${isError ? "error" : "info"}`}>{status}</div>
                )}
            </div>
        </div>
    );
}
