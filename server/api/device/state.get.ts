import { deviceHub } from "~/server/utils/deviceHub";
import { AllowType, SessionEvent } from "~/types";
import type { DeviceStatus } from '~~/types/device'

let handlerFunc = async (event: SessionEvent): Promise<DeviceStatus> => {
    return {
        online: deviceHub.peer !== null,
        lastSeen: deviceHub.lastSeen,
        connectedAt: deviceHub.connectedAt,
        state: deviceHub.state,
    }
};

export default defineEventHandler(async (event) => {
    return new BaseEventHandler(event, handlerFunc).handle({
        route: "/api/device/state",
        method: "GET",
        allowType: AllowType.AUTHENTICATED,
    });
});
