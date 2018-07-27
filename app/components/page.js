import Vue from 'vue'
import * as s11 from 'sharp11'
import * as music from '../music'

window.s11 = s11

const SCREENS = {
  UNKNOWN: 'unknown',
  EMPTY: 'empty',
  KEY_SIGNATURE: 'key_signature',
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
    Key signature:
      * 5 sharps
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
      if (this.isKeySignatureInput(input)) { return SCREENS.KEY_SIGNATURE }
      if (this.isScaleTypeInput(input)) { return SCREENS.SCALE_TYPE }
      if (this.isScaleInstanceInput(input)) { return SCREENS.SCALE_INSTANCE }
      if (this.isChordNamesInput(input)) { return SCREENS.CHORD_NAMES }
      if (this.isChordInstanceInput(input)) { return SCREENS.CHORD_INSTANCE }
      if (this.isChordTypeInput(input)) { return SCREENS.CHORD_TYPE }
      return SCREENS.UNKNOWN
    },

    screenData: function() {
      const input = (this.userInput || '').trim()

      const functions = {
        [SCREENS.KEY_SIGNATURE]: this.processKeySignatureInput,
        [SCREENS.CHORD_NAMES]: this.processChordNamesInput,
        [SCREENS.SCALE_TYPE]: this.processScaleTypeInput,
        [SCREENS.SCALE_INSTANCE]: this.processScaleInstanceInput,
        [SCREENS.CHORD_INSTANCE]: this.processChordInstanceInput,
        [SCREENS.CHORD_TYPE]: this.processChordTypeInput,
      }

      const [err, info] = functions[this.screenType].call(this, input)

      if (err) { this.showError(err) }
      return info
    }
  },

  methods: {
    showError(err) {
      console.error(err)
    },

    isKeySignatureInput(input) {
      return music.isKeySignature(input)
    },

    processKeySignatureInput(input) {
      try {
        return [null, music.getKeyForSignature(input)]
      } catch (e) {
        return [e, null]
      }
    },

    isChordNamesInput(input) {
      return input.split(' ').length > 1 && music.isNoteArray(input.split(' '))
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
      return music.isScaleInstance(input)
    },

    processScaleInstanceInput(input) {
      try {
        return [null, music.getScale(input)]
      } catch (e) {
        return [e, null]
      }
    },
  },
})
