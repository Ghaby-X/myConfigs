import { keepAwake, toggleKeepAwake } from "../awake"

// Shown in the bar only while "keep awake" is on; click to turn it off.
export default function Awake() {
  return (
    <button cssName="awake" visible={keepAwake} tooltipText="Keeping the screen awake — click to turn off" onClicked={toggleKeepAwake}>
      <image iconName="keep-awake-symbolic" />
    </button>
  )
}
