import { useNavigate } from "react-router";

interface VideoCardProps {
    href: string;
    imageUrl: string;
    title: string;
    channelId?: string;
    channelImage?: string;
    channelName: string;
    views?: number;
}

function formatViews(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
    return `${n} views`;
}

export function VideoCard({ href, imageUrl, title, channelId, channelImage, channelName, views }: VideoCardProps) {
    const navigate = useNavigate();

    function goToChannel(e: React.MouseEvent) {
        if (!channelId) return;
        e.stopPropagation();
        navigate(`/channel/${channelId}`);
    }

    return (
        <div className="video-card" onClick={() => navigate(href)}>
            <div className="video-card-thumb">
                <img src={imageUrl} alt={title} loading="lazy" />
            </div>
            <div className="video-card-meta">
                <div className={`video-card-avatar${channelId ? " channel-link" : ""}`} onClick={goToChannel}>
                    {channelImage && <img src={channelImage} alt={channelName} />}
                </div>
                <div className="video-card-info">
                    <div className="video-card-title">{title}</div>
                    <div
                        className={`video-card-channel${channelId ? " channel-link" : ""}`}
                        onClick={goToChannel}
                    >
                        {channelName}
                    </div>
                    {views !== undefined && (
                        <div className="video-card-views">{formatViews(views)}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface VideoCardRowProps {
    href: string;
    imageUrl: string;
    title: string;
    channelId?: string;
    channelName: string;
}

// Compact horizontal card used in the watch-page sidebar
export function VideoCardRow({ href, imageUrl, title, channelId, channelName }: VideoCardRowProps) {
    const navigate = useNavigate();

    function goToChannel(e: React.MouseEvent) {
        if (!channelId) return;
        e.stopPropagation();
        navigate(`/channel/${channelId}`);
    }

    return (
        <div className="video-card-row" onClick={() => navigate(href)}>
            <div className="video-card-row-thumb">
                <img src={imageUrl} alt={title} loading="lazy" />
            </div>
            <div className="video-card-row-info">
                <div className="video-card-row-title">{title}</div>
                <div
                    className={`video-card-row-channel${channelId ? " channel-link" : ""}`}
                    onClick={goToChannel}
                >
                    {channelName}
                </div>
            </div>
        </div>
    );
}
