import App from "@/App"
import { Appbar } from "@/components/Appbar"

import axios from "axios"


export function Signup(){
    async function signup(){
        axios.post("http://localhost:3000/api/signup", {
            username: document.getElementById("username")!.value,
            password: document.getElementById("password")!.value,
            channelName: document.getElementById("channelname")!.value,
            gender: "Male"
        }).then(response => {
            const data = response.data
            localStorage.setItem("token", data.token)
            window.location = "/signin"
        })
    }
    return <div>
        
        <input id="username" type="text" placeholder="Username"></input>
        <input id="password" type="password" placeholder="Password"></input>
        <input id="channelname" type="text" placeholder="Channel Name"></input>
        <button onClick={signup}>Sign up</button>
    </div>
}