import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router";
import { VideoCard } from "../components/VideoCard";

export function VideoPage(){

    const [searchParams] = useSearchParams();

    const [videoDetails, setVideoDetails] = useState<any>();
    const [loading, setLoading] = useState(true);
    const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);

    const id = searchParams.get("id");

    useEffect(()=>{
        axios.get("http://localhost:3000/api/videos/" + id).then((response)=>{
            setVideoDetails(response.data);
            setLoading(false);
        })
    }, [id])

    useEffect(()=>{
        axios.get("http://localhost:3000/api/videos").then((response)=>{
            setRecommendedVideos(response.data);
        })
    }, [id])

    if (loading) {
        return <div>Loading...</div>;
    }

    return <div style={{display: "flex"}}>
        <video src={videoDetails.videoUrl} controls style={{width: 640}}/>
        <br/>
        <div>
            {videoDetails.title}
        </div>
        <div>
            {videoDetails.user.channelName}
        </div>
        <div>
            <img src={videoDetails.user.profilePicture}/>
        </div>
        <div>
            {recommendedVideos.map(video => <VideoCard
                key={video.id}
                href={`/watch?id=${video.id}`}
                imageUrl={video.thumbnail}
                title={video.title}
                channelImage={video.user.profilePicture}
                channelName={video.user.channelName}
            />)}
        </div>
    </div>
}
