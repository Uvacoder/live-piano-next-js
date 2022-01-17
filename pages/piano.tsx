import { RoomProvider, useMyPresence, useOthers, useSelf } from '@liveblocks/react'
import LivePiano, { instrumentNames } from '../components/LivePiano'
import { ChangeEvent, useEffect, useState } from 'react'
import { NotePresence } from '../types'

export default function Root () {
  return (
    <RoomProvider id="example-live-piano">
      <PianoDemo />
    </RoomProvider>
  )
}

const defaultInstrument = 'piano'

function PianoDemo () {
  const [activeNotes, setActiveNotes] = useState<NotePresence[]>([])
  const [myPresence, updateMyPresence] = useMyPresence<NotePresence>()
  const self = useSelf()
  const others = useOthers<NotePresence>()

  // Format `others` into NotePresence[] format
  const formatOthers = () => {
    return others.toArray()
      // Skip if presence and presence.notes are not set for this remote user
      .filter(({ presence }) => presence?.notes)
      // Return instrument and notes
      .map(({ presence = {}, info, connectionId }) => {
        return {
          instrument: presence.instrument || defaultInstrument,
          notes: presence.notes || [],
          color: info.color,
          name: info.name,
          picture: info.picture,
          id: connectionId
        }
      })
  }

  const formatSelf = () => {
    if (!self) {
      return myPresence
    }
    return {
      ...myPresence,
      color: self.info.color,
      name: self.info.name,
      picture: self.info.picture,
      id: self.connectionId
    }
  }

  // Set initial values
  useEffect(() => {
    updateMyPresence({ instrument: defaultInstrument, notes: [] })
  }, [])

  // Update current notes being played when other user plays a note
  useEffect(() => {
    if (myPresence.notes && others.count) {
      setActiveNotes([formatSelf(), ...formatOthers()])
    }
  }, [others])

  // Update current notes being played when local user plays a note
  useEffect(() => {
    if (myPresence.notes) {
      setActiveNotes([formatSelf(), ...formatOthers()])
    }
  }, [myPresence])

  // When local user plays a note, add note, update presence and active notes
  function handlePlayNote (note: number) {
    const myNotes = [...myPresence.notes, note]
    updateMyPresence({ notes: myNotes })
  }

  // When local user releases a note, remove note, update presence and active notes
  function handleStopNote (note: number) {
    const myNotes = myPresence.notes.filter(n => n !== note)
    updateMyPresence({ notes: myNotes })
  }

  // Change my instrument
  function handleInstrumentChange (e: ChangeEvent<HTMLSelectElement>) {
    updateMyPresence({ instrument: e.target.value })
  }

  return (
    <div className="bg-gray-100 flex justify-center items-center h-full">
      <LivePiano
        activeNotes={activeNotes}
        onPlayNote={handlePlayNote}
        onStopNote={handleStopNote}
        defaultInstrument={defaultInstrument}
        showLetters={true}
      />
      <select onChange={handleInstrumentChange} defaultValue={defaultInstrument}>
        {instrumentNames.map(instrument => (
          <option key={instrument} value={instrument}>
            {instrument.charAt(0).toUpperCase() + instrument.slice(1)}
          </option>
        ))}
      </select>
    </div>
  )
}
