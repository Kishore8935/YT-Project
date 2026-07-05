import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router";
import { VideoCard } from "../components/VideoCard";
import { API_URL } from "../config";

interface ChannelInfo {
    id: string;
    channelName: string;
    profilePicture?: string;
    banner?: string;
    description?: string;
    subscriberCount: number;
}

interface ChannelVideo {
    id: string;
    title: string;
    thumbnail: string;
    views: number;
}

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

export function Channel() {
    const { id } = useParams();
    const [channel, setChannel] = useState<ChannelInfo | null>(null);
    const [videos, setVideos] = useState<ChannelVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        axios.get(`${API_URL}/api/channels/${id}`, { headers: authHeaders() })
            .then(res => {
                setChannel(res.data.channel);
                setVideos(res.data.videos);
                setIsSubscribed(res.data.isSubscribed);
                setIsOwner(res.data.isOwner);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    async function handleSubscribe() {
        if (!localStorage.getItem("token")) { alert("Sign in to subscribe."); return; }
        try {
            const res = await axios.post(
                `${API_URL}/api/channels/${id}/subscribe`,
                {},
                { headers: authHeaders() }
            );
            setIsSubscribed(res.data.subscribed);
            setChannel(prev => prev ? { ...prev, subscriberCount: res.data.subscriberCount } : prev);
        } catch { alert("Something went wrong."); }
    }

    if (loading) {
        return <div style={{ padding: 40, textAlign: "center", color: "var(--yt-text-secondary)" }}>Loading…</div>;
    }

    if (!channel) {
        return <div style={{ padding: 40, textAlign: "center", color: "var(--yt-text-secondary)" }}>Channel not found.</div>;
    }

    return (
        <div>
            <div className="channel-banner">
                {channel.banner && <img src={channel.banner} alt="" />}
            </div>

            <div className="channel-header">
                <div className="channel-avatar">
                    {channel.profilePicture && <img src={channel.profilePicture} alt={channel.channelName} />}
                </div>
                <div>
                    <div className="channel-name">{channel.channelName}</div>
                    <div className="channel-meta">{formatCount(channel.subscriberCount)} subscribers · {videos.length} videos</div>
                    {channel.description && <div className="channel-description">{channel.description}</div>}
                </div>

                {!isOwner && (
                    <div className="channel-actions">
                        <button
                            className={isSubscribed ? "btn-outline" : "btn-primary"}
                            onClick={handleSubscribe}
                        >
                            {isSubscribed ? "Subscribed" : "Subscribe"}
                        </button>
                    </div>
                )}
            </div>

            <div className="video-grid">
                {videos.length === 0
                    ? <div style={{ gridColumn: "1/-1", padding: 40, textAlign: "center", color: "var(--yt-text-secondary)" }}>
                        No videos yet.
                    </div>
                    : videos.map(video => (
                        <VideoCard
                            key={video.id}
                            href={`/watch?id=${video.id}`}
                            imageUrl={video.thumbnail}
                            title={video.title}
                            channelId={channel.id}
                            channelName={channel.channelName}
                            channelImage={channel.profilePicture}
                            views={video.views}
                        />
                    ))
                }
            </div>
        </div>
    );
}
