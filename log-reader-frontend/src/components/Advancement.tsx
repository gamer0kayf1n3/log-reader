export default function Advancement({ data, itemsPerPage, idx }: { data: any; prev?: any; itemsPerPage: number, idx: number }) {
    
    //var last5m = 

    return <div className="chat advancementParent">
        <p className="top">
            <span className="name">{data.player}</span>
            <span className="datetime"><a href={`/?page=${Math.trunc(idx / itemsPerPage + 1 )}`}>{data.dateTime.toLocaleString("en-US", { timeZone: "Asia/Singapore" })}</a></span>
        </p>
        <p className="advancement">{data.message}</p>
    </div>
}
