import React from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/lora/400.css'
import '@fontsource/lora/500.css'
import '@fontsource/lora/600.css'
import '@fontsource/lora/700.css'
import '@fontsource-variable/geist'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'

import '../index.css'

import ContractPage from './ContractPage.jsx'
import Contract, { client } from './Compass licence agreement.jsx'

createRoot(document.getElementById('root')).render(
  <ContractPage client={client}>
    <Contract />
  </ContractPage>,
)
