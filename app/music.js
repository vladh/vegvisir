import * as s11 from 'sharp11'

const KEY_SIGNATURES = [
  {major: 'C', minor: 'A', sharps: 0, flats: 0},
  {major: 'G', minor: 'E', sharps: 1, flats: 0},
  {major: 'D', minor: 'B', sharps: 2, flats: 0},
  {major: 'A', minor: 'F#', sharps: 3, flats: 0},
  {major: 'E', minor: 'C#', sharps: 4, flats: 0},

  {major: 'B', minor: 'G#', sharps: 5, flats: 0},
  {major: 'Cb', minor: 'Ab', sharps: 0, flats: 7},

  {major: 'Gb', minor: 'Eb', sharps: 0, flats: 6},
  {major: 'F#', minor: 'D#', sharps: 6, flats: 0},

  {major: 'Db', minor: 'Bb', sharps: 0, flats: 5},
  {major: 'C#', minor: 'A#', sharps: 7, flats: 0},

  {major: 'Ab', minor: 'F', sharps: 0, flats: 4},
  {major: 'Eb', minor: 'C', sharps: 0, flats: 3},
  {major: 'Bb', minor: 'G', sharps: 0, flats: 2},
  {major: 'F', minor: 'd', sharps: 0, flats: 1},
]

export function isKeySignature(sig) {
  const split = sig.split(' ')
  if (split.length != 2) { return false }
  return (
    Number.isInteger(+split[0]) &&
    (
      (+split[0] == 1 && ['sharp', 'flat'].includes(split[1])) ||
      (+split[0] > 1 && ['sharps', 'flats'].includes(split[1]))
    )
  )
}

export function getKeyForSignature(sig) {
  const [number, accidental] = sig.split(' ')
  const keySignature = KEY_SIGNATURES.find(d => {
    const fixedAccidental = (accidental + 's').replace('ss', 's')
    return d[fixedAccidental] == number
  })
  return {
    keySignature: keySignature,
    number: number,
    accidental: accidental,
  }
}

export function isNoteArray(notes) {
  try {
    notes.map(s11.note.create)
    return true
  } catch (e) {
    return false
  }
}

export function getChordNames(notes) {
  return {
    notes: notes.map(s11.note.create),
    names: s11.chord.getPossibleChordNamesFromArray(notes),
  }
}

export function isChord(name) {
  try {
    s11.chord.create(name)
    return true
  } catch (e) {
    return false
  }
}

export function getChordAndNormalise(name) {
  return s11.chord.create(
    s11.chord.identifyArray(
      s11.chord.create(name).chord.map(n => n.name)
    )
  )
}

export function getChord(name) {
  return getChordAndNormalise(name)
}

export function isChordQuality(quality) {
  try {
    const chord = s11.chord.create('C' + quality)
    if (
      chord.toString() == 'C E G' &&
      !(
        quality == '' || quality == 'M' || quality.toLowerCase() == 'maj'
      )
    ) {
      return false
    }
    return true
  } catch (e) {
    return false
  }
}

export function getChordQualityIntervals(quality) {
  const chord = getChordAndNormalise('C' + quality)
  const rawIntervals = chord.intervals
  const intervals = rawIntervals.reduce((intervals, interval, idx) => {
    if (interval) {
      const newInterval = {
        type: interval,
        degree: idx,
      }
      intervals = intervals.concat([newInterval])
    }
    return intervals
  }, [])
  return {intervals, chord}
}

export function isScale(scaleName) {
  try {
    s11.scale.create('C', scaleName.replace(' ', '_'))
    return true
  } catch (e) {
    return false
  }
}

export function getScaleIntervals(scaleName) {
  return s11.scale.create('C', scaleName.replace(' ', '_'))
}

export function isScaleInstance(scale) {
  const split = scale.split(' ')
  if (split.length < 2) { return false }
  const note = split[0]
  const type = split.slice(1).join('_')
  try {
    s11.scale.create(note, type)
    return true
  } catch (e) {
    return false
  }
}

export function getScale(scale) {
  const split = scale.split(' ')
  const note = split[0]
  const type = split.slice(1).join('_')
  return s11.scale.create(note, type)
}
