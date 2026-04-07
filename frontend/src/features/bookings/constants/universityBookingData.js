export const UNIVERSITY_ROOMS = {
  "Floor 1": {
    "Lecture Hall": ["LH101", "LH102"],
    "Smart Classroom": ["SC101", "SC102"],
    Classroom: ["CR101", "CR102"],
    Lab: ["LAB101"],
  },
  "Floor 2": {
    "Lecture Hall": ["LH201", "LH202"],
    "Smart Classroom": ["SC201", "SC202"],
    Classroom: ["CR201", "CR202"],
    Lab: ["LAB201"],
  },
  "Floor 3": {
    "Lecture Hall": ["LH301", "LH302"],
    "Smart Classroom": ["SC301", "SC302"],
    Classroom: ["CR301", "CR302"],
    Lab: ["LAB301"],
  },
  "Floor 4": {
    "Lecture Hall": ["LH401", "LH402"],
    "Smart Classroom": ["SC401", "SC402"],
    Classroom: ["CR401", "CR402"],
    Lab: ["LAB401"],
  },
};

export const DEPARTMENT_COURSES = {
  IT: ["Web Dev", "AI", "Networking"],
  SE: ["Software Architecture", "QA", "DevOps"],
  DS: ["Machine Learning", "Data Analytics"],
  BM: ["Marketing", "Finance"],
};

export const FLOORS = Object.keys(UNIVERSITY_ROOMS);

export function getRoomTypesByFloor(floor) {
  return Object.keys(UNIVERSITY_ROOMS[floor] || {});
}

export function getRoomsByFloorAndType(floor, roomType) {
  return UNIVERSITY_ROOMS[floor]?.[roomType] || [];
}
