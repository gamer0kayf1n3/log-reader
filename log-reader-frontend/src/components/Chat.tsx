export default function Chat({ data, prev, itemsPerPage, idx }: { data: any; prev?: any; itemsPerPage: number; idx: number }) {
    
    const timeDiff = data.dateTime.getTime() - (prev?.dateTime?.getTime() || 0);
    const last5m = timeDiff < 5 * 60 * 1000;

    var sameAuthor = prev?.player === data.player;
    var sameEvent = prev?.type === data.type;

    var hideTop = sameAuthor && sameEvent && last5m && idx % itemsPerPage != 0;
    return (
            <div className="chat">
                {!hideTop && (
                    <p className="top">
                        <span className="name">{data.player}</span>
                        <span className="datetime"><a href={`/?page=${Math.trunc(idx / itemsPerPage + 1 )}`}>{data.dateTime.toLocaleString("en-US", { timeZone: "Asia/Singapore" })}</a></span>
                    </p>
                )}
                <p className="main">{data.message}</p>
            </div>
        );
}