import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router";
import { VideoCardRow } from "../components/VideoCard";
import { API_URL } from "../config";

interface VideoDetails {
    id: string;
    title: string;
    videoUrl: string;
    views: number;
    likes: number;
    dislikes: number;
    user: {
        id: string;
        channelName: string;
        profilePicture?: string;
        subscriberCount: number;
    };
}

interface Comment {
    id: string;
    text: string;
    createdAt: string;
    user: {
        id: string;
        channelName: string;
        profilePicture?: string;
    };
}

interface RecommendedVideo {
    id: string;
    title: string;
    thumbnail: string;
    user: { id: string; channelName: string; profilePicture?: string };
}

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function getMyUserId(): string | null {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
        const parts = token.split(".");
        if (parts.length < 2 || !parts[1]) return null;
        const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(b64));
        return payload.userId ?? null;
    } catch { return null; }
}

function formatCount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

export function VideoPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [video, setVideo] = useState<VideoDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [recommended, setRecommended] = useState<RecommendedVideo[]>([]);

    // Engagement state
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [userReaction, setUserReaction] = useState<"LIKE" | "DISLIKE" | null>(null);
    const [subscribed, setSubscribed] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState(0);

    // Comments state
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [posting, setPosting] = useState(false);

    const id = searchParams.get("id");
    const myUserId = getMyUserId();

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setUserReaction(null);
        setSubscribed(false);

        Promise.all([
            axios.get(`${API_URL}/api/videos/${id}`),
            axios.get(`${API_URL}/api/videos/${id}/comments`),
            // Fire-and-forget: record a view
            axios.post(`${API_URL}/api/videos/${id}/view`, {}, { headers: authHeaders() }).catch(() => {}),
        ]).then(([videoRes, commentsRes]) => {
            const v = videoRes.data as VideoDetails;
            setVideo(v);
            setLikes(v.likes);
            setDislikes(v.dislikes);
            setSubscriberCount(v.user.subscriberCount);
            setComments(commentsRes.data.comments);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        axios.get(`${API_URL}/api/videos`).then(res => {
            setRecommended((res.data.videos as RecommendedVideo[]).filter(v => v.id !== id));
        });
    }, [id]);

    async function handleLike(type: "LIKE" | "DISLIKE") {
        if (!localStorage.getItem("token")) { alert("Sign in to like videos."); return; }
        try {
            const res = await axios.post(
                `${API_URL}/api/videos/${id}/like`,
                { type },
                { headers: authHeaders() }
            );
            setLikes(res.data.likes);
            setDislikes(res.data.dislikes);
            setUserReaction(res.data.userReaction);
        } catch { alert("Something went wrong."); }
    }

    async function handleSubscribe() {
        if (!localStorage.getItem("token")) { alert("Sign in to subscribe."); return; }
        try {
            const res = await axios.post(
                `${API_URL}/api/channels/${video!.user.id}/subscribe`,
                {},
                { headers: authHeaders() }
            );
            setSubscribed(res.data.subscribed);
            setSubscriberCount(res.data.subscriberCount);
        } catch { alert("Something went wrong."); }
    }

    async function handlePostComment(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!commentText.trim()) return;
        if (!localStorage.getItem("token")) { alert("Sign in to comment."); return; }
        setPosting(true);
        try {
            const res = await axios.post(
                `${API_URL}/api/videos/${id}/comments`,
                { text: commentText.trim() },
                { headers: authHeaders() }
            );
            setComments(prev => [res.data, ...prev]);
            setCommentText("");
        } catch { alert("Something went wrong."); }
        finally { setPosting(false); }
    }

    async function handleDeleteComment(commentId: string) {
        try {
            await axios.delete(`${API_URL}/api/comments/${commentId}`, { headers: authHeaders() });
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch { alert("Could not delete comment."); }
    }

    if (loading) {
        return (
            <div className="watch-container">
                <div className="watch-primary">
                    <div className="skeleton" style={{ width: "100%", aspectRatio: "16/9", borderRadius: 8 }} />
                    <div className="skeleton skeleton-line" style={{ width: "60%", marginTop: 16, height: 20 }} />
                    <div className="skeleton skeleton-line" style={{ width: "30%", marginTop: 10 }} />
                </div>
            </div>
        );
    }

    if (!video) {
        return <div style={{ padding: 40, textAlign: "center", color: "var(--yt-text-secondary)" }}>Video not found.</div>;
    }

    return (
        <div className="watch-container">
            {/* Left column */}
            <div className="watch-primary">
                <div className="watch-video-wrapper">
                    <video src={video.videoUrl} controls />
                </div>

                <h1 className="watch-title">{video.title}</h1>

                {/* Like/dislike + view count */}
                <div className="watch-actions-row">
                    <button
                        className={userReaction === "LIKE" ? "btn-primary" : "btn-outline"}
                        onClick={() => handleLike("LIKE")}
                    >
                        👍 {formatCount(likes)}
                    </button>
                    <button
                        className={userReaction === "DISLIKE" ? "btn-primary" : "btn-outline"}
                        onClick={() => handleLike("DISLIKE")}
                    >
                        👎 {formatCount(dislikes)}
                    </button>
                    <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--yt-text-secondary)" }}>
                        {formatCount(video.views)} views
                    </span>
                </div>

                {/* Channel info + subscribe */}
                <div className="watch-channel-row">
                    <div
                        className="watch-channel-avatar channel-link"
                        onClick={() => navigate(`/channel/${video.user.id}`)}
                    >
                        {video.user.profilePicture && (
                            <img src={video.user.profilePicture} alt={video.user.channelName} />
                        )}
                    </div>
                    <div>
                        <div
                            className="watch-channel-name channel-link"
                            onClick={() => navigate(`/channel/${video.user.id}`)}
                        >
                            {video.user.channelName}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--yt-text-secondary)" }}>
                            {formatCount(subscriberCount)} subscribers
                        </div>
                    </div>
                    <button
                        className={subscribed ? "btn-outline" : "btn-primary"}
                        style={{ marginLeft: "auto" }}
                        onClick={handleSubscribe}
                    >
                        {subscribed ? "Subscribed" : "Subscribe"}
                    </button>
                </div>

                {/* Comments */}
                <div className="watch-comments">
                    <div className="watch-comments-title">{comments.length} Comments</div>

                    <form className="watch-comment-form" onSubmit={handlePostComment}>
                        <input
                            className="form-input"
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                        />
                        <button className="btn-primary" type="submit" disabled={posting || !commentText.trim()}>
                            {posting ? "Posting..." : "Comment"}
                        </button>
                    </form>

                    <div className="watch-comment-list">
                        {comments.map(comment => (
                            <div key={comment.id} className="watch-comment">
                                <div className="watch-comment-avatar">
                                    {comment.user.profilePicture && (
                                        <img src={comment.user.profilePicture} alt={comment.user.channelName} />
                                    )}
                                </div>
                                <div className="watch-comment-body">
                                    <div className="watch-comment-header">
                                        <span className="watch-comment-author">{comment.user.channelName}</span>
                                        <span className="watch-comment-date">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                        {myUserId === comment.user.id && (
                                            <button
                                                className="watch-comment-delete"
                                                onClick={() => handleDeleteComment(comment.id)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    <p className="watch-comment-text">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right column: recommended */}
            <div className="watch-secondary">
                <div className="watch-secondary-title">Up next</div>
                {recommended.map(v => (
                    <VideoCardRow
                        key={v.id}
                        href={`/watch?id=${v.id}`}
                        imageUrl={v.thumbnail}
                        title={v.title}
                        channelId={v.user.id}
                        channelName={v.user.channelName}
                    />
                ))}
            </div>
        </div>
    );
}
