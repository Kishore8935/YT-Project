import { use, useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router";
import { VideoCard } from "../components/VideoCard";

export function VideoPage(){

    const [searchParams, setSearchParams] = useSearchParams();
    


    const [videoDetails, setVideoDetails] = useState();
    const [loading, setLoading] = useState(true);   
    const [recommendedVideos, setRecommendedVideos] = useState([]);



    const id = searchParams.get("id");

    useEffect(()=>{
        axios.get("http://localhost:3000/api/videos/" + id).then((response)=>{
            setVideoDetails(response.data);
            setLoading(false);
        
        })
    }, [id])

    useEffect(()=>{
        axios.get("http://localhost:3000/api/videos/" + id).then((response)=>{
            setRecommendedVideos(response.data);
            setLoading(false);
        })
    }, [id])

    if (loading) {
        return <div>Loading...</div>;
    }

    return <div style={{display: "flex"}}>
        <video src={videoDetails.videoUrl}/>
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
            {recommendedVideos.map(video)}
        </div>
    </div>
}   