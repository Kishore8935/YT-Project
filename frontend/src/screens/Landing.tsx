import { VideoCard } from "../components/VideoCard";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { API_URL } from "../config";

interface Video {
    id: string;
    title: string;
    thumbnail: string;
    views: number;
    user: {
        id: string;
        channelName: string;
        profilePicture?: string;
    };
}

function SkeletonCard() {
    return (
        <div>
            <div className="skeleton skeleton-thumb" />
            <div className="video-card-meta">
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-line" style={{ width: "90%" }} />
                    <div className="skeleton skeleton-line" style={{ width: "60%", marginTop: 6 }} />
                </div>
            </div>
        </div>
    );
}

export function Landing() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const search = searchParams.get("search") ?? "";

    useEffect(() => {
        setLoading(true);
        const params = search ? `?search=${encodeURIComponent(search)}` : "";
        axios.get(`${API_URL}/api/videos${params}`)
            .then(response => {
                setVideos(response.data.videos);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [search]);

    return (
        <div>
            {search && (
                <div style={{ padding: "16px 24px 0", fontSize: 14, color: "var(--yt-text-secondary)" }}>
                    Search results for <strong>"{search}"</strong>
                </div>
            )}
            <div className="video-grid">
                {loading
                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                    : videos.length === 0
                        ? <div style={{ gridColumn: "1/-1", padding: 40, textAlign: "center", color: "var(--yt-text-secondary)" }}>
                            No videos found.
                        </div>
                        : videos.map(video => (
                            <VideoCard
                                key={video.id}
                                href={`/watch?id=${video.id}`}
                                imageUrl={video.thumbnail}
                                title={video.title}
                                channelId={video.user.id}
                                channelImage={video.user.profilePicture}
                                channelName={video.user.channelName}
                                views={video.views}
                            />
                        ))
                }
            </div>
        </div>
    );
}
