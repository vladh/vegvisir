import Vue from 'vue'
import * as s11 from 'sharp11'
import * as music from '../music'
import Vex from 'vexflow'

window.s11 = s11

const SCREENS = {
  UNKNOWN: 'unknown',
  EMPTY: 'empty',
  CIRCLE: 'circle',
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
    Circle of fifths:
      * circle
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
      const input = (this.userInput || '').trim().replace(/\s\s+/g, ' ')
      if (!input || input.length == 0) { return SCREENS.EMPTY }
      if (this.isCircleInput(input)) { return SCREENS.CIRCLE }
      if (this.isKeySignatureInput(input)) { return SCREENS.KEY_SIGNATURE }
      if (this.isScaleTypeInput(input)) { return SCREENS.SCALE_TYPE }
      if (this.isScaleInstanceInput(input)) { return SCREENS.SCALE_INSTANCE }
      if (this.isChordNamesInput(input)) { return SCREENS.CHORD_NAMES }
      if (this.isChordInstanceInput(input)) { return SCREENS.CHORD_INSTANCE }
      if (this.isChordTypeInput(input)) { return SCREENS.CHORD_TYPE }
      return SCREENS.UNKNOWN
    },

    screenData: function() {
      this.makeContext() // worst side effect ever lol

      const input = (this.userInput || '').trim().replace(/\s\s+/g, ' ')

      const functions = {
        [SCREENS.CIRCLE]: this.processCircleInput,
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

    isCircleInput(input) {
      return input == 'circle'
    },

    processCircleInput(input) {
      return true
    },

    isKeySignatureInput(input) {
      return music.isKeySignature(input)
    },

    processKeySignatureInput(input) {
      try {
        const info = music.getKeyForSignature(input)
        this.$nextTick(() => this.drawKeySignature(info.keySignature.major))
        return [null, info]
      } catch (e) {
        return [e, null]
      }
    },

    isChordNamesInput(input) {
      return input.split(' ').length > 1 &&
        music.isNoteArray(input.split(' '))
    },

    processChordNamesInput(input) {
      const notes = input.split(' ')
      try {
        const info = music.getChordNames(notes)
        this.$nextTick(() => this.drawChord(music.addOctavesToNotes(info.notes)))
        return [null, info]
      } catch (e) {
        return [e, null]
      }
    },

    isChordInstanceInput(input) {
      if (input.toLowerCase().startsWith('add')) {
        return false
      }
      return music.isChord(input)
    },

    processChordInstanceInput(input) {
      try {
        const chord = music.getChord(input)
        this.$nextTick(() => this.drawChord(chord.chord))
        return [null, chord]
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
        const scale = music.getScale(input)
        this.$nextTick(() => this.drawNotes(scale.scale))
        return [null, scale]
      } catch (e) {
        return [e, null]
      }
    },

    noteNameToVex(name) {
      const pitch = name.slice(0, -1)
      const octave = name.slice(-1)
      return pitch.toLowerCase() + '/' + octave
    },

    addVexAccidentalsForNotes(notes, staveNote) {
      notes.forEach((n, idx) => {
        if (n.accidental != 'n') {
          staveNote = staveNote.addAccidental(
            idx, new Vex.Flow.Accidental(n.accidental)
          )
        }
      })
      return staveNote
    },

    makeContext() {
      const elMusic = this.$el.querySelector('.engraving')
      const elMusicDims = elMusic.getBoundingClientRect()
      elMusic.innerHTML = ''
      const renderer = new Vex.Flow.Renderer(elMusic, Vex.Flow.Renderer.Backends.SVG)
      renderer.resize(elMusicDims.width - 50, elMusicDims.height)
      return renderer.getContext()
    },

    drawNotes(notes) {
      const context = this.makeContext()
      const stave = new Vex.Flow.Stave(0, 0, 500)
      stave.addClef('treble')
      stave.setContext(context).draw()

      const tickables = notes.map(n =>
        this.addVexAccidentalsForNotes(
          [n],
          new Vex.Flow.StaveNote({
            clef: 'treble',
            keys: [this.noteNameToVex(n.fullName)],
            duration: 'q',
          })
        )
      )

      const voices = [
        new Vex.Flow.Voice({num_beats: notes.length, beat_value: 4})
          .addTickables(tickables)
      ]

      const formatter = new Vex.Flow.Formatter().joinVoices(voices).format(voices, 500)

      voices.forEach(v => v.draw(context, stave))
    },

    drawChord(notes) {
      const context = this.makeContext()
      const stave = new Vex.Flow.Stave(0, 0, 200)
      stave.addClef('treble')
      stave.setContext(context).draw()

      const tickables = [
        this.addVexAccidentalsForNotes(
          notes,
          new Vex.Flow.StaveNote({
            clef: 'treble',
            keys: notes.map(n => n.fullName).map(this.noteNameToVex),
            duration: 'w',
          }),
        )
      ]

      const voices = [
        new Vex.Flow.Voice({num_beats: 4, beat_value: 4})
          .addTickables(tickables)
      ]

      const formatter = new Vex.Flow.Formatter().joinVoices(voices).format(voices, 200)

      voices.forEach(v => v.draw(context, stave))
    },

    drawKeySignature(key) {
      const context = this.makeContext()
      const stave = new Vex.Flow.Stave(0, 0, 100)
      stave.addKeySignature(key)
      stave.setContext(context).draw()
    },
  },
})
