import * as s11 from 'sharp11'

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

export function getChord(name) {
  return s11.chord.create(name)
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
  return s11.chord.create('C' + quality)
}

export function isScale(scaleName) {
  try {
    s11.scale.create('C', scaleName)
    return true
  } catch (e) {
    return false
  }
}

export function getScaleIntervals(scaleName) {
  return s11.scale.create('C', scaleName)
}

export function isScaleInstance(note, scaleName) {
  try {
    s11.scale.create(note, scaleName)
    return true
  } catch (e) {
    return false
  }
}

export function getScale(note, scaleName) {
  return s11.scale.create(note, scaleName)
}
