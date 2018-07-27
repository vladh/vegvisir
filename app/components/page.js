import Vue from 'vue'
import * as s11 from 'sharp11'
import * as music from '../music'

const SCREENS = {
  UNKNOWN: 'unknown',
  EMPTY: 'empty',
  CHORD_NAMES: 'chord_names',
  CHORD_INSTANCE: 'chord_instance',
  CHORD_TYPE: 'chord_type',
  SCALE_INSTANCE: 'scale_instance',
  SCALE_TYPE: 'scale_type',
}

Vue.component('page', {
  delimiters: ['${', '}'],
  template: '#component-template--page',
  data: function() {
    return {
      userInput: null,
    }
  },

  mounted() {
  },

  /*
    Chord names:
      * C E G
    Chord instance:
      * Cmaj
    Chord type:
      * maj7
    Scale instance:
      * F mixolydian
    Scale type:
      * Mixolydian
  */

  computed: {
    screenType: function() {
      const input = (this.userInput || '').trim()
      if (!input || input.length == 0) { return SCREENS.EMPTY }
      if (this.isChordNamesInput(input)) { return SCREENS.CHORD_NAMES }
      if (this.isScaleTypeInput(input)) { return SCREENS.SCALE_TYPE }
      if (this.isScaleInstanceInput(input)) { return SCREENS.SCALE_INSTANCE }
      if (this.isChordInstanceInput(input)) { return SCREENS.CHORD_INSTANCE }
      if (this.isChordTypeInput(input)) { return SCREENS.CHORD_TYPE }
      return SCREENS.UNKNOWN
    },

    screenData: function() {
      const input = (this.userInput || '').trim()
      let err = null
      let info = {}

      if (this.screenType == SCREENS.CHORD_NAMES) {
        [err, info] = this.processChordNamesInput(input)
      } else if (this.screenType == SCREENS.SCALE_TYPE) {
        [err, info] = this.processScaleTypeInput(input)
      } else if (this.screenType == SCREENS.SCALE_INSTANCE) {
        [err, info] = this.processScaleInstanceInput(input)
      } else if (this.screenType == SCREENS.CHORD_INSTANCE) {
        [err, info] = this.processChordInstanceInput(input)
      } else if (this.screenType == SCREENS.CHORD_TYPE) {
        [err, info] = this.processChordTypeInput(input)
      }

      if (err) { this.showError(err) }
      return info
    }
  },

  methods: {
    showError(err) {
      alert(err)
    },

    isChordNamesInput(input) {
      return music.isNoteArray(input.split(' '))
    },

    processChordNamesInput(input) {
      const notes = input.split(' ')
      try {
        return [null, music.getChordNames(notes)]
      } catch (e) {
        return [e, null]
      }
    },

    isChordInstanceInput(input) {
      return music.isChord(input)
    },

    processChordInstanceInput(input) {
      try {
        return [null, music.getChord(input)]
      } catch (e) {
        return [e, null]
      }
    },

    isChordTypeInput(input) {
      return music.isChordQuality(input)
    },

    processChordTypeInput(input) {
      try {
        return [null, music.getChordQualityIntervals(input)]
      } catch (e) {
        return [e, null]
      }
    },

    isScaleTypeInput(input) {
      return music.isScale(input)
    },

    processScaleTypeInput(input) {
      try {
        return [null, music.getScaleIntervals(input)]
      } catch (e) {
        return [e, null]
      }
    },

    isScaleInstanceInput(input) {
      const split = input.split(' ')
      if (split.length != 2) { return false }
      return music.isScaleInstance(split[0], split[1])
    },

    processScaleInstanceInput(input) {
      const [note, scaleName] = input.split(' ')
      try {
        return [null, music.getScale(note, scaleName)]
      } catch (e) {
        return [e, null]
      }
    },
  },
})
