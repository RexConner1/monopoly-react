import { HOUSE_SLOTS } from "../../../../assets/houseSlots";

export default function DisplayHouses() {
    return (
    <div id="display-houses">
        {HOUSE_SLOTS.map(slot => (
            <div
                key={slot.position}
                data-position={slot.position}
                data-rotate={slot.rotate}
                className="street-houses"
                style={{
                    top: slot.top,
                    left: slot.left
                }}
            />
        ))}
    </div>
    );
}