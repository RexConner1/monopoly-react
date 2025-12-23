export function PropertyActions({
    advancedStreet
}: {
    advancedStreet: boolean;
}) {
    return (
        <div>
            <center>
                {advancedStreet ? (
                    <div id="advanced-responses" />
                ) : (
                    <>
                        <button id="card-response-yes">YES</button>
                        <button id="card-response-no">NO</button>
                    </>
                )}
            </center>
        </div>
    );
}
