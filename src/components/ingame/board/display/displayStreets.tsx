import { STREET_SLOTS } from "../../../../assets/streetSlots";

export default function DisplayStreets() {
    return (
    <div id="display-streets">
        {STREET_SLOTS.map(slot => (
            <div
                key={slot.position}
                data-position={slot.position}
                className="street"
                style={{
                    width: slot.width,
                    height: slot.height,
                    top: slot.top,
                    left: slot.left
                }}
            />
        ))}
    </div>
    );
}
