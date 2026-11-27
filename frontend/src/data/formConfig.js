// Shared clinical feature config used by both Dashboard and Compare pages

export const INITIAL_FORM = {
    age: 48, bp: 80, sg: 1.02, al: 1, su: 0,
    bgr: 121, bu: 36, sc: 1.2, sod: 135, pot: 4.5,
    hemo: 15.4, pcv: 44, wc: 7800, rc: 5.2,
    rbc: 'normal', pc: 'normal', pcc: 'notpresent', ba: 'notpresent'
};

export const LABELS = {
    age: 'Age (yrs)', bp: 'Blood Pressure', sg: 'Specific Gravity',
    al: 'Albumin (0-5)', su: 'Sugar (0-5)', bgr: 'Blood Glucose',
    bu: 'Blood Urea', sc: 'Serum Creatinine', sod: 'Sodium',
    pot: 'Potassium', hemo: 'Hemoglobin', pcv: 'Packed Cell Vol',
    wc: 'WBC Count', rc: 'RBC Count', rbc: 'Red Blood Cells',
    pc: 'Pus Cell', pcc: 'Pus Cell Clumps', ba: 'Bacteria'
};

export const DROPDOWNS = {
    rbc: ['normal', 'abnormal'],
    pc:  ['normal', 'abnormal'],
    pcc: ['notpresent', 'present'],
    ba:  ['notpresent', 'present']
};
