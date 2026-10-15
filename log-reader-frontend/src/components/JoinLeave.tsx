import "../App.css";
export default function JoinLeave({ data, itemsPerPage, idx }: { data: any; prev?: any; itemsPerPage: number, idx: number }) {
    
    //  var last5m = 

    return <div className="chat">
        <p className="joinBlock">{data.player} {data.message == 1 ? "joined" : "left"} the game (<a href={`/?page=${Math.trunc(idx / itemsPerPage + 1 )}`}>{data.dateTime.toLocaleString("en-US", { timeZone: "Asia/Singapore" })}</a>)</p>
    </div>
}