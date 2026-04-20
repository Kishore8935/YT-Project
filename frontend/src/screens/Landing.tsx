import App from "@/App"
import { Appbar } from "@/components/Appbar"
import axios from "axios"
import {useEffect, useState} from "react"

export function Landing(){
    const [videos, setvideos] = useState([])
    

    useEffect(()=>{
        axios.get("http://localhost:3000/api/videos")
            .then(response => {
                const data = response.data
                setvideos(data)
            })
    },[])

    return <div style={{display: "flex", padding: 50}}>
        {videos.map(video => <VideoCard
            href={`/watch?id=${video.id}`}
            imageUrl={video.thumbnail}
            title={video.title}
            channelImage={video.user.profilePicture}
            channelName={video.user.channelName}
        />)}
    </div>

}

interface IvideoCard{
    imageUrl: string;
    title: string;
    channelImage: string;
    channelName: string;
    href: string;   
}

function VideoCard({imageUrl, title, channelImage, channelName, href}: IvideoCard){
  

    return <div>
        
        <div style={{ borderRadius: 30, margin:20}} onClick={() => window.location=href}>
            <img src={imageUrl} style={{display: "block", width: "100%", borderRadius: 30}}/>
            <div>
                {title}
            </div>
            <div>
                <img src={channelImage} style={{width:30, borderRadius: "50%"}}/>
                {channelName}
            </div>
        </div>

    </div>

    
    
    
}