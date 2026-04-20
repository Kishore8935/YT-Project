import axios from "axios"

export function Upload(){

    function upload(){
        axios.post("http://localhost:3000/api/videos", {
            //title: (document.getElementById("title") as HTMLInputElement).value,
            videoUrl: (document.getElementById("videoUrl") as HTMLInputElement).value,
            thumbnail: (document.getElementById("thumbnail") as HTMLInputElement).value
        },{
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
    }
    return <div>
        
        <input  id="videoUrl"  type="text" placeholder="video url"></input>
        <input id="thumbnail" type="text" placeholder="thumbnail"></input>
        <button onClick={upload}>Complete upload</button>
        upload page
    </div>
}