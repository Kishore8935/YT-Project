export function Appbar(){
    return  <div style={{"display":"flex", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottom: "1px solid #ccc"}}>
        <div>
            Youtube
        </div>
        <div>
            <button onClick={()=>window.location = "/upload"}>Upload</button>
        </div>
    </div>
}