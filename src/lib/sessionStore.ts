import { BROWSER } from '$app/environment';
import type { Staff } from '$lib/db';

type Session = {
    currentUser: Staff | null;
    currentShiftId: string | null;
};

const initialValue = { currentUser: null, currentShiftId: null };

const initial = BROWSER ? JSON.parse(window.localStorage.getItem('pos.session') || JSON.stringify(initialValue)) : initialValue;

const session = $state(initial);

function updateStorage() {
    if (BROWSER) {
        window.localStorage.setItem('pos.session', JSON.stringify(session));
    }
}

export const sessionStore = {
    get current() {
        return session;
    },
    login: (staff: Staff, shiftId: string) => {
        session.currentUser = staff;
        session.currentShiftId = shiftId;
        updateStorage();
    },
    logout: () => {
        session.currentUser = null;
        session.currentShiftId = null;
        updateStorage();
    },
    setShift: (shiftId: string) => {
        session.currentShiftId = shiftId;
        updateStorage();
    },
    clearShift: () => {
        session.currentShiftId = null;
        updateStorage();
    }
};
