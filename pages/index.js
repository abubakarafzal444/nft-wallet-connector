import React, { useEffect, useRef, useState } from "react";
import {
  Tab,
  Tabs,
  RadioGroup,
  Radio,
  FormGroup,
  InputGroup,
  NumericInput,
} from "@blueprintjs/core";
import "../node_modules/@blueprintjs/core/lib/css/blueprint.css";
import "../node_modules/@blueprintjs/icons/lib/css/blueprint-icons.css";
import "../node_modules/normalize.css/normalize.css";
import {
  Address,
  BaseAddress,
  MultiAsset,
  Assets,
  ScriptHash,
  Costmdls,
  Language,
  CostModel,
  AssetName,
  TransactionUnspentOutput,
  TransactionUnspentOutputs,
  TransactionOutput,
  Value,
  TransactionBuilder,
  TransactionBuilderConfigBuilder,
  TransactionOutputBuilder,
  LinearFee,
  BigNum,
  BigInt,
  TransactionHash,
  TransactionInputs,
  TransactionInput,
  TransactionWitnessSet,
  Transaction,
  PlutusData,
  PlutusScripts,
  PlutusScript,
  PlutusList,
  Redeemers,
  Redeemer,
  RedeemerTag,
  Ed25519KeyHashes,
  ConstrPlutusData,
  ExUnits,
  Int,
  NetworkInfo,
  EnterpriseAddress,
  TransactionOutputs,
  hash_transaction,
  hash_script_data,
  hash_plutus_data,
  ScriptDataHash,
  Ed25519KeyHash,
  NativeScript,
  StakeCredential,
} from "@emurgo/cardano-serialization-lib-asmjs";
import { blake2b } from "blakejs";
let Buffer = require("buffer/").Buffer;
let blake = require("blakejs");

const App = () => {
  const [selectedTabId, setSelectedTabId] = useState("1");
  const [whichWalletSelected, setWhichWalletSelected] = useState(undefined);
  const [walletFound, setWalletFound] = useState(false);
  const [walletIsEnabled, setWalletIsEnabled] = useState(false);
  const [walletName, setWalletName] = useState(undefined);
  const [walletIcon, setWalletIcon] = useState(undefined);

  const [walletAPIVersion, setWalletAPIVersion] = useState(undefined);
  const [wallets, setWallets] = useState([]);
  const [networkId, setNetworkId] = useState(undefined);
  const [Utxos, setUtxos] = useState(undefined);
  const [CollatUtxos, setCollatUtxos] = useState(undefined);
  const [balance, setBalance] = useState(undefined);

  const [changeAddress, setChangeAddress] = useState(undefined);
  const [rewardAddress, setRewardAddress] = useState(undefined);
  const [usedAddress, setUsedAddress] = useState(undefined);
  const [txBody, setTxBody] = useState(undefined);
  const [txBodyCborHex_unsigned, setTxBodyCborHex_unsigned] = useState("");
  const [txBodyCborHex_signed, setTxBodyCborHex_signed] = useState("");

  const [submittedTxHash, setSubmittedTxHash] = useState("");
  const [addressBech32SendADA, setAddressBech32SendADA] = useState(
    "addr_test1qrt7j04dtk4hfjq036r2nfewt59q8zpa69ax88utyr6es2ar72l7vd6evxct69wcje5cs25ze4qeshejy828h30zkydsu4yrmm"
  );
  const [lovelaceToSend, setLovelaceToSend] = useState(3000000);
  const [assetNameHex, setAssetNameHex] = useState("4c494645");
  const [assetPolicyIdHex, setAssetPolicyIdHex] = useState(
    "ae02017105527c6c0c9840397a39cc5ca39fabe5b9998ba70fda5f2f"
  );
  const [assetAmountToSend, setAssetAmountToSend] = useState(5);

  const [addressScriptBech32, setAddressScriptBech32] = useState(
    "addr_test1wpnlxv2xv9a9ucvnvzqakwepzl9ltx7jzgm53av2e9ncv4sysemm8"
  );
  const [datumStr, setDatumStr] = useState("12345678");
  const [plutusScriptCborHex, setPlutusScriptCborHex] = useState(
    "4e4d01000033222220051200120011"
  );
  const [transactionIdLocked, setTransactionIdLocked] = useState("");
  const [transactionIndxLocked, setTransactionIndxLocked] = useState(0);
  const [lovelaceLocked, setLovelaceLocked] = useState(3000000);
  const [manualFee, setManualFee] = useState(900000);

  /**
   * When the wallet is connect it returns the connector which is
   * written to this API variable and all the other operations
   * run using this API object
   */
  // const [API, setAPI] = useState(undefined);
  const API = useRef(null);

  /**
   * Protocol parameters
   * @type {{
   * keyDeposit: string,
   * coinsPerUtxoWord: string,
   * minUtxo: string,
   * poolDeposit: string,
   * maxTxSize: number,
   * priceMem: number,
   * maxValSize: number,
   * linearFee: {minFeeB: string, minFeeA: string}, priceStep: number
   * }}
   */
  const [protocolParams, setProtocolParams] = useState({
    linearFee: {
      minFeeA: "44",
      minFeeB: "155381",
    },
    minUtxo: "34482",
    poolDeposit: "500000000",
    keyDeposit: "2000000",
    maxValSize: 5000,
    maxTxSize: 16384,
    priceMem: 0.0577,
    priceStep: 0.0000721,
    coinsPerUtxoWord: "34482",
  });

  /**
   * Poll the wallets it can read from the browser.
   * Sometimes the html document loads before the browser initialized browser plugins (like Nami or Flint).
   * So we try to poll the wallets 3 times (with 1 second in between each try).
   *
   * Note: CCVault and Eternl are the same wallet, Eternl is a rebrand of CCVault
   * So both of these wallets as the Eternl injects itself twice to maintain
   * backward compatibility
   *
   * @param count The current try count.
   */

  const pollWallets = (count = 0) => {
    const wallets = [];
    for (const key in window.cardano) {
      if (window.cardano[key].enable && wallets.indexOf(key) === -1) {
        wallets.push(key);
      }
    }
    if (wallets.length === 0 && count < 3) {
      setTimeout(() => {
        pollWallets(count + 1);
      }, 1000);
      return;
    }
    if (wallets.length > 0) {
      setWallets(wallets);
      setWhichWalletSelected(wallets[0]);
    }
  };
  /**
   * Handles the tab selection on the user form
   * @param tabId
   */
  const handleTabId = (tabId) => setSelectedTabId(tabId);

  /**
   * Handles the radio buttons on the form that
   * let the user choose which wallet to work with
   * @param obj
   */
  const handleWalletSelect = (obj) => {
    const whichWalletSelected = obj.target.value;
    setWhichWalletSelected(whichWalletSelected);
  };

  /**
   * Generate address from the plutus contract cborhex
   */
  const generateScriptAddress = () => {
    // cborhex of the alwayssucceeds.plutus
    // const cborhex = "4e4d01000033222220051200120011";
    // const cbor = Buffer.from(cborhex, "hex");
    // const blake2bhash = blake.blake2b(cbor, 0, 28);

    const script = PlutusScript.from_bytes(
      Buffer.from(plutusScriptCborHex, "hex")
    );
    // const blake2bhash = blake.blake2b(script.to_bytes(), 0, 28);
    const blake2bhash =
      "67f33146617a5e61936081db3b2117cbf59bd2123748f58ac9678656";
    const scripthash = ScriptHash.from_bytes(Buffer.from(blake2bhash, "hex"));

    const cred = StakeCredential.from_scripthash(scripthash);
    const networkId = NetworkInfo.testnet().network_id();
    const baseAddr = EnterpriseAddress.new(networkId, cred);
    const addr = baseAddr.to_address();
    const addrBech32 = addr.to_bech32();

    // hash of the address generated from script
    console.log(Buffer.from(addr.to_bytes(), "utf8").toString("hex"));

    // hash of the address generated using cardano-cli
    const ScriptAddress = Address.from_bech32(
      "addr_test1wpnlxv2xv9a9ucvnvzqakwepzl9ltx7jzgm53av2e9ncv4sysemm8"
    );
    console.log(Buffer.from(ScriptAddress.to_bytes(), "utf8").toString("hex"));

    console.log(ScriptAddress.to_bech32());
    console.log(addrBech32);
  };

  /**
   * Checks if the wallet is running in the browser
   * Does this for Nami, Eternl and Flint wallets
   * @returns {boolean}
   */

  const checkIfWalletFound = () => {
    const walletKey = whichWalletSelected;
    const walletFound = !!window?.cardano?.[walletKey];
    setWalletFound(walletFound);
    return walletFound;
  };

  /**
   * Checks if a connection has been established with
   * the wallet
   * @returns {Promise<boolean>}
   */
  const checkIfWalletEnabled = async () => {
    let walletIsEnabled = false;

    try {
      const walletName = whichWalletSelected;
      walletIsEnabled = await window.cardano[walletName].isEnabled();
    } catch (err) {
      console.log(err);
    }
    setWalletIsEnabled(walletIsEnabled);

    return walletIsEnabled;
  };

  /**
   * Enables the wallet that was chosen by the user
   * When this executes the user should get a window pop-up
   * from the wallet asking to approve the connection
   * of this app to the wallet
   * @returns {Promise<boolean>}
   */

  const enableWallet = async () => {
    const walletKey = whichWalletSelected;
    try {
      const APIResult = await window.cardano[walletKey].enable();
      API = APIResult;
    } catch (err) {
      console.log(err);
    }
    return checkIfWalletEnabled();
  };

  /**
   * Get the API version used by the wallets
   * writes the value to state
   * @returns {*}
   */
  const getAPIVersion = () => {
    const walletKey = whichWalletSelected;
    const walletAPIVersion = window?.cardano?.[walletKey].apiVersion;
    setWalletAPIVersion(walletAPIVersion);
    return walletAPIVersion;
  };

  /**
   * Get the name of the wallet (nami, eternl, flint)
   * and store the name in the state
   * @returns {*}
   */

  const getWalletName = () => {
    const walletKey = whichWalletSelected;
    const walletName = window?.cardano?.[walletKey].name;
    setWalletName(walletName);
    return walletName;
  };
  /**
   * Gets the Network ID to which the wallet is connected
   * 0 = testnet
   * 1 = mainnet
   * Then writes either 0 or 1 to state
   * @returns {Promise<void>}
   */
  const getNetworkId = async () => {
    try {
      const networkId = await API.getNetworkId();
      setNetworkId(networkId);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Gets the UTXOs from the user's wallet and then
   * stores in an object in the state
   * @returns {Promise<void>}
   */

  const getUtxos = async () => {
    let Utxos = [];

    try {
      const rawUtxos = await API.getUtxos();

      for (const rawUtxo of rawUtxos) {
        const utxo = TransactionUnspentOutput.from_bytes(
          Buffer.from(rawUtxo, "hex")
        );
        const input = utxo.input();
        const txid = Buffer.from(
          input.transaction_id().to_bytes(),
          "utf8"
        ).toString("hex");
        const txindx = input.index();
        const output = utxo.output();
        const amount = output.amount().coin().to_str(); // ADA amount in lovelace
        const multiasset = output.amount().multiasset();
        let multiAssetStr = "";

        if (multiasset) {
          const keys = multiasset.keys(); // policy Ids of thee multiasset
          const N = keys.len();
          // console.log(`${N} Multiassets in the UTXO`)

          for (let i = 0; i < N; i++) {
            const policyId = keys.get(i);
            const policyIdHex = Buffer.from(
              policyId.to_bytes(),
              "utf8"
            ).toString("hex");
            // console.log(`policyId: ${policyIdHex}`)
            const assets = multiasset.get(policyId);
            const assetNames = assets.keys();
            const K = assetNames.len();
            // console.log(`${K} Assets in the Multiasset`)

            for (let j = 0; j < K; j++) {
              const assetName = assetNames.get(j);
              const assetNameString = Buffer.from(
                assetName.name(),
                "utf8"
              ).toString();
              const assetNameHex = Buffer.from(
                assetName.name(),
                "utf8"
              ).toString("hex");
              const multiassetAmt = multiasset.get_asset(policyId, assetName);
              multiAssetStr += `+ ${multiassetAmt.to_str()} + ${policyIdHex}.${assetNameHex} (${assetNameString})`;
              // console.log(assetNameString)
              // console.log(`Asset Name: ${assetNameHex}`)
            }
          }
        }

        const obj = {
          txid: txid,
          txindx: txindx,
          amount: amount,
          str: `${txid} #${txindx} = ${amount}`,
          multiAssetStr: multiAssetStr,
          TransactionUnspentOutput: utxo,
        };
        Utxos.push(obj);
        // console.log(`utxo: ${str}`)
      }
      setUtxos(Utxos);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * The collateral is need for working with Plutus Scripts
   * Essentially you need to provide collateral to pay for fees if the
   * script execution fails after the script has been validated...
   * this should be an uncommon occurrence and would suggest the smart contract
   * would have been incorrectly written.
   * The amount of collateral to use is set in the wallet
   * @returns {Promise<void>}
   */
  const getCollateral = async () => {
    let CollatUtxos = [];

    try {
      let collateral = [];

      const wallet = whichWalletSelected;
      if (wallet === "nami") {
        collateral = await API.experimental.getCollateral();
      } else {
        collateral = await API.getCollateral();
      }

      for (const x of collateral) {
        const utxo = TransactionUnspentOutput.from_bytes(Buffer.from(x, "hex"));
        CollatUtxos.push(utxo);
        // console.log(utxo)
      }
      setCollatUtxos(CollatUtxos);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Gets the current balance of in Lovelace in the user's wallet
   * This doesnt resturn the amounts of all other Tokens
   * For other tokens you need to look into the full UTXO list
   * @returns {Promise<void>}
   */

  const getBalance = async () => {
    try {
      console.log("API", API);
      const balanceCBORHex = await API.getBalance();
      const balance = Value.from_bytes(Buffer.from(balanceCBORHex, "hex"))
        .coin()
        .to_str();
      setBalance(balance);
      console.log("balamce", balance);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Get the address from the wallet into which any spare UTXO should be sent
   * as change when building transactions.
   * @returns {Promise<void>}
   */
  const getChangeAddress = async () => {
    try {
      const raw = await API.getChangeAddress();
      const changeAddress = Address.from_bytes(
        Buffer.from(raw, "hex")
      ).to_bech32();
      setChangeAddress(changeAddress);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * This is the Staking address into which rewards from staking get paid into
   * @returns {Promise<void>}
   */
  const getRewardAddresses = async () => {
    try {
      const raw = await API.getRewardAddresses();
      const rawFirst = raw[0];
      const rewardAddress = Address.from_bytes(
        Buffer.from(rawFirst, "hex")
      ).to_bech32();
      // console.log(rewardAddress)
      setRewardAddress(rewardAddress);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Gets previsouly used addresses
   * @returns {Promise<void>}
   */
  const getUsedAddresses = async () => {
    try {
      const raw = await API.getUsedAddresses();
      const rawFirst = raw[0];
      const usedAddress = Address.from_bytes(
        Buffer.from(rawFirst, "hex")
      ).to_bech32();
      // console.log(rewardAddress)
      setUsedAddress(usedAddress);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Refresh all the data from the user's wallet
   * @returns {Promise<void>}
   */
  const refreshData = async () => {
    generateScriptAddress();

    try {
      const walletFound = checkIfWalletFound();
      if (walletFound) {
        await getAPIVersion();
        await getWalletName();
        const walletEnabled = await enableWallet();
        if (walletEnabled && API) {
          await getNetworkId();
          await getUtxos();
          await getCollateral();
          await getBalance();
          await getChangeAddress();
          await getRewardAddresses();
          await getUsedAddresses();
        } else {
          setUtxos(null);
          setCollatUtxos(null);
          setBalance(null);
          setChangeAddress(null);
          setRewardAddress(null);
          setUsedAddress(null);
          setTxBody(null);
          setTxBodyCborHex_unsigned("");
          setTxBodyCborHex_signed("");
          setSubmittedTxHash("");
        }
      } else {
        setWalletIsEnabled(false);
        setUtxos(null);
        setCollatUtxos(null);
        setBalance(null);
        setChangeAddress(null);
        setRewardAddress(null);
        setUsedAddress(null);
        setTxBody(null);
        setTxBodyCborHex_unsigned("");
        setTxBodyCborHex_signed("");
        setSubmittedTxHash("");
      }
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Every transaction starts with initializing the
   * TransactionBuilder and setting the protocol parameters
   * This is boilerplate
   * @returns {Promise<TransactionBuilder>}
   */
  const initTransactionBuilder = async () => {
    const txBuilder = TransactionBuilder.new(
      TransactionBuilderConfigBuilder.new()
        .fee_algo(
          LinearFee.new(
            BigNum.from_str(protocolParams.linearFee.minFeeA),
            BigNum.from_str(protocolParams.linearFee.minFeeB)
          )
        )
        .pool_deposit(BigNum.from_str(protocolParams.poolDeposit))
        .key_deposit(BigNum.from_str(protocolParams.keyDeposit))
        .coins_per_utxo_word(BigNum.from_str(protocolParams.coinsPerUtxoWord))
        .max_value_size(protocolParams.maxValSize)
        .max_tx_size(protocolParams.maxTxSize)
        .prefer_pure_change(true)
        .build()
    );

    return txBuilder;
  };

  /**
   * Builds an object with all the UTXOs from the user's wallet
   * @returns {Promise<TransactionUnspentOutputs>}
   */
  const getTxUnspentOutputs = async () => {
    let txOutputs = TransactionUnspentOutputs.new();
    for (const utxo of Utxos) {
      txOutputs.add(utxo.TransactionUnspentOutput);
    }
    return txOutputs;
  };

  /**
   * The transaction is build in 3 stages:
   * 1 - initialize the Transaction Builder
   * 2 - Add inputs and outputs
   * 3 - Calculate the fee and how much change needs to be given
   * 4 - Build the transaction body
   * 5 - Sign it (at this point the user will be prompted for
   * a password in his wallet)
   * 6 - Send the transaction
   * @returns {Promise<void>}
   */
  const buildSendADATransaction = async () => {
    const txBuilder = await initTransactionBuilder();
    const shelleyOutputAddress = Address.from_bech32(addressBech32SendADA);
    const shelleyChangeAddress = Address.from_bech32(changeAddress);

    txBuilder.add_output(
      TransactionOutput.new(
        shelleyOutputAddress,
        Value.new(BigNum.from_str(lovelaceToSend.toString()))
      )
    );

    // Find the available UTXOs in the wallet and
    // us them as Inputs
    const txUnspentOutputs = await getTxUnspentOutputs();
    txBuilder.add_inputs_from(txUnspentOutputs, 1);

    // calculate the min fee required and send any change to an address
    txBuilder.add_change_if_needed(shelleyChangeAddress);

    // once the transaction is ready, we build it to get the tx body without witnesses
    const txBody = txBuilder.build();

    // Tx witness
    const transactionWitnessSet = TransactionWitnessSet.new();

    const tx = Transaction.new(
      txBody,
      TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
    );

    let txVkeyWitnesses = await API.signTx(
      Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
      true
    );

    console.log(txVkeyWitnesses);

    txVkeyWitnesses = TransactionWitnessSet.from_bytes(
      Buffer.from(txVkeyWitnesses, "hex")
    );

    transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

    const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

    const submittedTxHash = await API.submitTx(
      Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
    );
    console.log(submittedTxHash);
    setSubmittedTxHash(submittedTxHash);
  };

  const buildSendTokenTransaction = async () => {
    const txBuilder = await initTransactionBuilder();
    const shelleyOutputAddress = Address.from_bech32(addressBech32SendADA);
    const shelleyChangeAddress = Address.from_bech32(changeAddress);

    let txOutputBuilder = TransactionOutputBuilder.new();
    txOutputBuilder = txOutputBuilder.with_address(shelleyOutputAddress);
    txOutputBuilder = txOutputBuilder.next();

    let multiAsset = MultiAsset.new();
    let assets = Assets.new();
    assets.insert(
      AssetName.new(Buffer.from(assetNameHex, "hex")), // Asset Name
      BigNum.from_str(assetAmountToSend.toString()) // How much to send
    );
    multiAsset.insert(
      ScriptHash.from_bytes(Buffer.from(assetPolicyIdHex, "hex")), // PolicyID
      assets
    );

    txOutputBuilder = txOutputBuilder.with_asset_and_min_required_coin(
      multiAsset,
      BigNum.from_str(protocolParams.coinsPerUtxoWord)
    );
    const txOutput = txOutputBuilder.build();

    txBuilder.add_output(txOutput);

    // Find the available UTXOs in the wallet and
    // us them as Inputs
    const txUnspentOutputs = await getTxUnspentOutputs();
    txBuilder.add_inputs_from(txUnspentOutputs, 3);

    // set the time to live - the absolute slot value before the tx becomes invalid
    // txBuilder.set_ttl(51821456);

    // calculate the min fee required and send any change to an address
    txBuilder.add_change_if_needed(shelleyChangeAddress);

    // once the transaction is ready, we build it to get the tx body without witnesses
    const txBody = txBuilder.build();

    // Tx witness
    const transactionWitnessSet = TransactionWitnessSet.new();

    const tx = Transaction.new(
      txBody,
      TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
    );

    let txVkeyWitnesses = await API.signTx(
      Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
      true
    );
    txVkeyWitnesses = TransactionWitnessSet.from_bytes(
      Buffer.from(txVkeyWitnesses, "hex")
    );

    transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

    const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

    const submittedTxHash = await API.submitTx(
      Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
    );
    console.log(submittedTxHash);
    setSubmittedTxHash(submittedTxHash);

    // const txBodyCborHex_unsigned = Buffer.from(txBody.to_bytes(), "utf8").toString("hex");
    //setTxBodyCborHex_unsigned(txBodyCborHex_unsigned);setTxBody(txBody)
  };

  const buildSendAdaToPlutusScript = async () => {
    const txBuilder = await initTransactionBuilder();
    const ScriptAddress = Address.from_bech32(addressScriptBech32);
    const shelleyChangeAddress = Address.from_bech32(changeAddress);

    let txOutputBuilder = TransactionOutputBuilder.new();
    txOutputBuilder = txOutputBuilder.with_address(ScriptAddress);
    const dataHash = hash_plutus_data(
      PlutusData.new_integer(BigInt.from_str(datumStr))
    );
    txOutputBuilder = txOutputBuilder.with_data_hash(dataHash);

    txOutputBuilder = txOutputBuilder.next();

    txOutputBuilder = txOutputBuilder.with_value(
      Value.new(BigNum.from_str(lovelaceToSend.toString()))
    );
    const txOutput = txOutputBuilder.build();

    txBuilder.add_output(txOutput);

    // Find the available UTXOs in the wallet and
    // us them as Inputs
    const txUnspentOutputs = await getTxUnspentOutputs();
    txBuilder.add_inputs_from(txUnspentOutputs, 2);

    // calculate the min fee required and send any change to an address
    txBuilder.add_change_if_needed(shelleyChangeAddress);

    // once the transaction is ready, we build it to get the tx body without witnesses
    const txBody = txBuilder.build();

    // Tx witness
    const transactionWitnessSet = TransactionWitnessSet.new();

    const tx = Transaction.new(
      txBody,
      TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
    );

    let txVkeyWitnesses = await API.signTx(
      Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
      true
    );
    txVkeyWitnesses = TransactionWitnessSet.from_bytes(
      Buffer.from(txVkeyWitnesses, "hex")
    );

    transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

    const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

    const submittedTxHash = await API.submitTx(
      Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
    );
    console.log(submittedTxHash);
    setSubmittedTxHash(submittedTxHash);
    setTransactionIdLocked(submittedTxHash);
    setLovelaceLocked(lovelaceToSend);
  };

  const buildSendTokenToPlutusScript = async () => {
    const txBuilder = await initTransactionBuilder();
    const ScriptAddress = Address.from_bech32(addressScriptBech32);
    const shelleyChangeAddress = Address.from_bech32(changeAddress);

    let txOutputBuilder = TransactionOutputBuilder.new();
    txOutputBuilder = txOutputBuilder.with_address(ScriptAddress);
    const dataHash = hash_plutus_data(
      PlutusData.new_integer(BigInt.from_str(datumStr))
    );
    txOutputBuilder = txOutputBuilder.with_data_hash(dataHash);

    txOutputBuilder = txOutputBuilder.next();

    let multiAsset = MultiAsset.new();
    let assets = Assets.new();
    assets.insert(
      AssetName.new(Buffer.from(assetNameHex, "hex")), // Asset Name
      BigNum.from_str(assetAmountToSend.toString()) // How much to send
    );
    multiAsset.insert(
      ScriptHash.from_bytes(Buffer.from(assetPolicyIdHex, "hex")), // PolicyID
      assets
    );

    // txOutputBuilder = txOutputBuilder.with_asset_and_min_required_coin(multiAsset, BigNum.from_str(protocolParams.coinsPerUtxoWord))

    txOutputBuilder = txOutputBuilder.with_coin_and_asset(
      BigNum.from_str(lovelaceToSend.toString()),
      multiAsset
    );

    const txOutput = txOutputBuilder.build();

    txBuilder.add_output(txOutput);

    // Find the available UTXOs in the wallet and
    // us them as Inputs
    const txUnspentOutputs = await getTxUnspentOutputs();
    txBuilder.add_inputs_from(txUnspentOutputs, 3);

    // calculate the min fee required and send any change to an address
    txBuilder.add_change_if_needed(shelleyChangeAddress);

    // once the transaction is ready, we build it to get the tx body without witnesses
    const txBody = txBuilder.build();

    // Tx witness
    const transactionWitnessSet = TransactionWitnessSet.new();

    const tx = Transaction.new(
      txBody,
      TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
    );

    let txVkeyWitnesses = await API.signTx(
      Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
      true
    );
    txVkeyWitnesses = TransactionWitnessSet.from_bytes(
      Buffer.from(txVkeyWitnesses, "hex")
    );

    transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

    const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

    const submittedTxHash = await API.submitTx(
      Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
    );
    console.log(submittedTxHash);
    setSubmittedTxHash(submittedTxHash);
    setTransactionIdLocked(submittedTxHash);
    setLovelaceLocked(lovelaceToSend);
  };

  const buildRedeemAdaFromPlutusScript = async () => {
    const txBuilder = await initTransactionBuilder();
    const ScriptAddress = Address.from_bech32(addressScriptBech32);
    const shelleyChangeAddress = Address.from_bech32(changeAddress);

    txBuilder.add_input(
      ScriptAddress,
      TransactionInput.new(
        TransactionHash.from_bytes(Buffer.from(transactionIdLocked, "hex")),
        transactionIndxLocked.toString()
      ),
      Value.new(BigNum.from_str(lovelaceLocked.toString()))
    ); // how much lovelace is at that UTXO

    txBuilder.set_fee(BigNum.from_str(Number(manualFee).toString()));

    const scripts = PlutusScripts.new();
    scripts.add(
      PlutusScript.from_bytes(Buffer.from(plutusScriptCborHex, "hex"))
    ); //from cbor of plutus script

    // Add outputs
    const outputVal = lovelaceLocked.toString() - Number(manualFee);
    const outputValStr = outputVal.toString();
    txBuilder.add_output(
      TransactionOutput.new(
        shelleyChangeAddress,
        Value.new(BigNum.from_str(outputValStr))
      )
    );

    // once the transaction is ready, we build it to get the tx body without witnesses
    const txBody = txBuilder.build();

    const collateral = CollatUtxos;
    const inputs = TransactionInputs.new();
    collateral.forEach((utxo) => {
      inputs.add(utxo.input());
    });

    let datums = PlutusList.new();
    // datums.add(PlutusData.from_bytes(Buffer.from(datumStr, "utf8")))
    datums.add(PlutusData.new_integer(BigInt.from_str(datumStr)));

    const redeemers = Redeemers.new();

    const data = PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(BigNum.from_str("0"), PlutusList.new())
    );

    const redeemer = Redeemer.new(
      RedeemerTag.new_spend(),
      BigNum.from_str("0"),
      data,
      ExUnits.new(BigNum.from_str("7000000"), BigNum.from_str("3000000000"))
    );

    redeemers.add(redeemer);

    // Tx witness
    const transactionWitnessSet = TransactionWitnessSet.new();

    transactionWitnessSet.set_plutus_scripts(scripts);
    transactionWitnessSet.set_plutus_data(datums);
    transactionWitnessSet.set_redeemers(redeemers);

    // Pre Vasil hard fork cost model
    // const cost_model_vals = [
    //     197209, 0, 1, 1, 396231, 621, 0, 1, 150000, 1000,
    //     0, 1, 150000, 32, 2477736, 29175, 4, 29773, 100, 29773, 100, 29773, 100,
    //     29773, 100, 29773, 100, 29773, 100, 100, 100, 29773, 100, 150000, 32, 150000,
    //     32, 150000, 32, 150000, 1000, 0, 1, 150000, 32, 150000, 1000, 0, 8, 148000,
    //     425507, 118, 0, 1, 1, 150000, 1000, 0, 8, 150000, 112536, 247, 1, 150000,
    //     10000, 1, 136542, 1326, 1, 1000, 150000, 1000, 1, 150000, 32, 150000, 32,
    //     150000, 32, 1, 1, 150000, 1, 150000, 4, 103599, 248, 1, 103599, 248, 1,
    //     145276, 1366, 1, 179690, 497, 1, 150000, 32, 150000, 32, 150000, 32, 150000,
    //     32, 150000, 32, 150000, 32, 148000, 425507, 118, 0, 1, 1, 61516, 11218, 0,
    //     1, 150000, 32, 148000, 425507, 118, 0, 1, 1, 148000, 425507, 118, 0, 1, 1,
    //     2477736, 29175, 4, 0, 82363, 4, 150000, 5000, 0, 1, 150000, 32, 197209, 0,
    //     1, 1, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 150000, 32,
    //     150000, 32, 3345831, 1, 1
    // ];

    /*
        Post Vasil hard fork cost model
        If you need to make this code work on the Mainnet, before Vasil hard-fork
        Then you need to comment this section below and uncomment the cost model above
        Otherwise it will give errors when redeeming from Scripts
        Sending assets and ada to Script addresses is unaffected by this cost model
         */
    const cost_model_vals = [
      205665, 812, 1, 1, 1000, 571, 0, 1, 1000, 24177, 4, 1, 1000, 32, 117366,
      10475, 4, 23000, 100, 23000, 100, 23000, 100, 23000, 100, 23000, 100,
      23000, 100, 100, 100, 23000, 100, 19537, 32, 175354, 32, 46417, 4, 221973,
      511, 0, 1, 89141, 32, 497525, 14068, 4, 2, 196500, 453240, 220, 0, 1, 1,
      1000, 28662, 4, 2, 245000, 216773, 62, 1, 1060367, 12586, 1, 208512, 421,
      1, 187000, 1000, 52998, 1, 80436, 32, 43249, 32, 1000, 32, 80556, 1,
      57667, 4, 1000, 10, 197145, 156, 1, 197145, 156, 1, 204924, 473, 1,
      208896, 511, 1, 52467, 32, 64832, 32, 65493, 32, 22558, 32, 16563, 32,
      76511, 32, 196500, 453240, 220, 0, 1, 1, 69522, 11687, 0, 1, 60091, 32,
      196500, 453240, 220, 0, 1, 1, 196500, 453240, 220, 0, 1, 1, 806990, 30482,
      4, 1927926, 82523, 4, 265318, 0, 4, 0, 85931, 32, 205665, 812, 1, 1,
      41182, 32, 212342, 32, 31220, 32, 32696, 32, 43357, 32, 32247, 32, 38314,
      32, 9462713, 1021, 10,
    ];

    const costModel = CostModel.new();
    cost_model_vals.forEach((x, i) => costModel.set(i, Int.new_i32(x)));

    const costModels = Costmdls.new();
    costModels.insert(Language.new_plutus_v1(), costModel);

    const scriptDataHash = hash_script_data(redeemers, costModels, datums);
    txBody.set_script_data_hash(scriptDataHash);

    txBody.set_collateral(inputs);

    const baseAddress = BaseAddress.from_address(shelleyChangeAddress);
    const requiredSigners = Ed25519KeyHashes.new();
    requiredSigners.add(baseAddress.payment_cred().to_keyhash());

    txBody.set_required_signers(requiredSigners);

    const tx = Transaction.new(
      txBody,
      TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
    );

    let txVkeyWitnesses = await API.signTx(
      Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
      true
    );
    txVkeyWitnesses = TransactionWitnessSet.from_bytes(
      Buffer.from(txVkeyWitnesses, "hex")
    );

    transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

    const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

    const submittedTxHash = await API.submitTx(
      Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
    );
    console.log(submittedTxHash);
    setSubmittedTxHash(submittedTxHash);
  };

  const buildRedeemTokenFromPlutusScript = async () => {
    const txBuilder = await initTransactionBuilder();
    const ScriptAddress = Address.from_bech32(addressScriptBech32);
    const shelleyChangeAddress = Address.from_bech32(changeAddress);

    let multiAsset = MultiAsset.new();
    let assets = Assets.new();
    assets.insert(
      AssetName.new(Buffer.from(assetNameHex, "hex")), // Asset Name
      BigNum.from_str(assetAmountToSend.toString()) // How much to send
    );

    multiAsset.insert(
      ScriptHash.from_bytes(Buffer.from(assetPolicyIdHex, "hex")), // PolicyID
      assets
    );

    txBuilder.add_input(
      ScriptAddress,
      TransactionInput.new(
        TransactionHash.from_bytes(Buffer.from(transactionIdLocked, "hex")),
        transactionIndxLocked.toString()
      ),
      Value.new_from_assets(multiAsset)
    ); // how much lovelace is at that UTXO

    txBuilder.set_fee(BigNum.from_str(Number(manualFee).toString()));

    const scripts = PlutusScripts.new();
    scripts.add(
      PlutusScript.from_bytes(Buffer.from(plutusScriptCborHex, "hex"))
    ); //from cbor of plutus script

    // Add outputs
    const outputVal = lovelaceLocked.toString() - Number(manualFee);
    const outputValStr = outputVal.toString();

    let txOutputBuilder = TransactionOutputBuilder.new();
    txOutputBuilder = txOutputBuilder.with_address(shelleyChangeAddress);
    txOutputBuilder = txOutputBuilder.next();
    txOutputBuilder = txOutputBuilder.with_coin_and_asset(
      BigNum.from_str(outputValStr),
      multiAsset
    );

    const txOutput = txOutputBuilder.build();
    txBuilder.add_output(txOutput);

    // once the transaction is ready, we build it to get the tx body without witnesses
    const txBody = txBuilder.build();

    const collateral = CollatUtxos;
    const inputs = TransactionInputs.new();
    collateral.forEach((utxo) => {
      inputs.add(utxo.input());
    });

    let datums = PlutusList.new();
    // datums.add(PlutusData.from_bytes(Buffer.from(datumStr, "utf8")))
    datums.add(PlutusData.new_integer(BigInt.from_str(datumStr)));

    const redeemers = Redeemers.new();

    const data = PlutusData.new_constr_plutus_data(
      ConstrPlutusData.new(BigNum.from_str("0"), PlutusList.new())
    );

    const redeemer = Redeemer.new(
      RedeemerTag.new_spend(),
      BigNum.from_str("0"),
      data,
      ExUnits.new(BigNum.from_str("7000000"), BigNum.from_str("3000000000"))
    );

    redeemers.add(redeemer);

    // Tx witness
    const transactionWitnessSet = TransactionWitnessSet.new();

    transactionWitnessSet.set_plutus_scripts(scripts);
    transactionWitnessSet.set_plutus_data(datums);
    transactionWitnessSet.set_redeemers(redeemers);

    // Pre Vasil hard fork cost model
    // const cost_model_vals = [197209, 0, 1, 1, 396231, 621, 0, 1, 150000, 1000, 0, 1, 150000, 32, 2477736, 29175, 4, 29773, 100, 29773, 100, 29773, 100, 29773, 100, 29773, 100, 29773, 100, 100, 100, 29773, 100, 150000, 32, 150000, 32, 150000, 32, 150000, 1000, 0, 1, 150000, 32, 150000, 1000, 0, 8, 148000, 425507, 118, 0, 1, 1, 150000, 1000, 0, 8, 150000, 112536, 247, 1, 150000, 10000, 1, 136542, 1326, 1, 1000, 150000, 1000, 1, 150000, 32, 150000, 32, 150000, 32, 1, 1, 150000, 1, 150000, 4, 103599, 248, 1, 103599, 248, 1, 145276, 1366, 1, 179690, 497, 1, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 148000, 425507, 118, 0, 1, 1, 61516, 11218, 0, 1, 150000, 32, 148000, 425507, 118, 0, 1, 1, 148000, 425507, 118, 0, 1, 1, 2477736, 29175, 4, 0, 82363, 4, 150000, 5000, 0, 1, 150000, 32, 197209, 0, 1, 1, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 150000, 32, 3345831, 1, 1];

    /*
        Post Vasil hard fork cost model
        If you need to make this code work on the Mainnnet, before Vasil hard-fork
        Then you need to comment this section below and uncomment the cost model above
        Otherwise it will give errors when redeeming from Scripts
        Sending assets and ada to Script addresses is unaffected by this cost model
         */
    const cost_model_vals = [
      205665, 812, 1, 1, 1000, 571, 0, 1, 1000, 24177, 4, 1, 1000, 32, 117366,
      10475, 4, 23000, 100, 23000, 100, 23000, 100, 23000, 100, 23000, 100,
      23000, 100, 100, 100, 23000, 100, 19537, 32, 175354, 32, 46417, 4, 221973,
      511, 0, 1, 89141, 32, 497525, 14068, 4, 2, 196500, 453240, 220, 0, 1, 1,
      1000, 28662, 4, 2, 245000, 216773, 62, 1, 1060367, 12586, 1, 208512, 421,
      1, 187000, 1000, 52998, 1, 80436, 32, 43249, 32, 1000, 32, 80556, 1,
      57667, 4, 1000, 10, 197145, 156, 1, 197145, 156, 1, 204924, 473, 1,
      208896, 511, 1, 52467, 32, 64832, 32, 65493, 32, 22558, 32, 16563, 32,
      76511, 32, 196500, 453240, 220, 0, 1, 1, 69522, 11687, 0, 1, 60091, 32,
      196500, 453240, 220, 0, 1, 1, 196500, 453240, 220, 0, 1, 1, 806990, 30482,
      4, 1927926, 82523, 4, 265318, 0, 4, 0, 85931, 32, 205665, 812, 1, 1,
      41182, 32, 212342, 32, 31220, 32, 32696, 32, 43357, 32, 32247, 32, 38314,
      32, 9462713, 1021, 10,
    ];

    const costModel = CostModel.new();
    cost_model_vals.forEach((x, i) => costModel.set(i, Int.new_i32(x)));

    const costModels = Costmdls.new();
    costModels.insert(Language.new_plutus_v1(), costModel);

    const scriptDataHash = hash_script_data(redeemers, costModels, datums);
    txBody.set_script_data_hash(scriptDataHash);

    txBody.set_collateral(inputs);

    const baseAddress = BaseAddress.from_address(shelleyChangeAddress);
    const requiredSigners = Ed25519KeyHashes.new();
    requiredSigners.add(baseAddress.payment_cred().to_keyhash());

    txBody.set_required_signers(requiredSigners);

    const tx = Transaction.new(
      txBody,
      TransactionWitnessSet.from_bytes(transactionWitnessSet.to_bytes())
    );

    let txVkeyWitnesses = await API.signTx(
      Buffer.from(tx.to_bytes(), "utf8").toString("hex"),
      true
    );
    txVkeyWitnesses = TransactionWitnessSet.from_bytes(
      Buffer.from(txVkeyWitnesses, "hex")
    );

    transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

    const signedTx = Transaction.new(tx.body(), transactionWitnessSet);

    const submittedTxHash = await API.submitTx(
      Buffer.from(signedTx.to_bytes(), "utf8").toString("hex")
    );
    console.log(submittedTxHash);
    setSubmittedTxHash(submittedTxHash);
  };
  useEffect(() => {
    const func = async () => {
      pollWallets();
      await refreshData();
    };
    func();
  }, []);

  useEffect(() => {
    const func = async () => {
      await refreshData();
    };
    if (wallets.length > 0 && API) func();
  }, [wallets, whichWalletSelected, API]);

  return (
    <div style={{ margin: "20px" }}>
      <h1>Boilerplate DApp connector to Wallet</h1>
      <div style={{ paddingTop: "10px" }}>
        <div style={{ marginBottom: 15 }}>Select wallet:</div>
        <RadioGroup
          onChange={handleWalletSelect}
          selectedValue={whichWalletSelected}
          inline={true}
          className="wallets-wrapper"
        >
          {wallets.map((key) => (
            <Radio key={key} className="wallet-label" value={key}>
              <img
                src={window.cardano[key].icon}
                width={24}
                height={24}
                alt={key}
              />
              {window.cardano[key].name} ({key})
            </Radio>
          ))}
        </RadioGroup>
      </div>

      <button style={{ padding: "20px" }} onClick={refreshData}>
        Refresh
      </button>

      <p style={{ paddingTop: "20px" }}>
        <span style={{ fontWeight: "bold" }}>Wallet Found: </span>
        {`${walletFound}`}
      </p>
      <p>
        <span style={{ fontWeight: "bold" }}>Wallet Connected: </span>
        {`${walletIsEnabled}`}
      </p>
      <p>
        <span style={{ fontWeight: "bold" }}>Wallet API version: </span>
        {walletAPIVersion}
      </p>
      <p>
        <span style={{ fontWeight: "bold" }}>Wallet name: </span>
        {walletName}
      </p>

      <p>
        <span style={{ fontWeight: "bold" }}>
          Network Id (0 = testnet; 1 = mainnet):{" "}
        </span>
        {networkId}
      </p>
      <p style={{ paddingTop: "20px" }}>
        <span style={{ fontWeight: "bold" }}>
          UTXOs: (UTXO #txid = ADA amount + AssetAmount + policyId.AssetName +
          ...):{" "}
        </span>
        {Utxos?.map((x) => (
          <li
            style={{ fontSize: "10px" }}
            key={`${x.str}${x.multiAssetStr}`}
          >{`${x.str}${x.multiAssetStr}`}</li>
        ))}
      </p>
      <p style={{ paddingTop: "20px" }}>
        <span style={{ fontWeight: "bold" }}>Balance: </span>
        {balance}
      </p>
      <p>
        <span style={{ fontWeight: "bold" }}>Change Address: </span>
        {changeAddress}
      </p>
      <p>
        <span style={{ fontWeight: "bold" }}>Staking Address: </span>
        {rewardAddress}
      </p>
      <p>
        <span style={{ fontWeight: "bold" }}>Used Address: </span>
        {usedAddress}
      </p>
      <hr style={{ marginTop: "40px", marginBottom: "40px" }} />

      <Tabs
        id="TabsExample"
        vertical={true}
        onChange={handleTabId}
        selectedTabId={selectedTabId}
      >
        <Tab
          id="1"
          title="1. Send ADA to Address"
          panel={
            <div style={{ marginLeft: "20px" }}>
              <FormGroup
                helperText="insert an address where you want to send some ADA ..."
                label="Address where to send ADA"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) =>
                    setAddressBech32SendADA(event.target.value)
                  }
                  value={addressBech32SendADA}
                />
              </FormGroup>
              <FormGroup
                helperText="Adjust Order Amount ..."
                label="Lovelaces (1 000 000 lovelaces = 1 ADA)"
                labelFor="order-amount-input2"
              >
                <NumericInput
                  id="order-amount-input2"
                  disabled={false}
                  leftIcon={"variable"}
                  allowNumericCharactersOnly={true}
                  value={lovelaceToSend}
                  min={1000000}
                  stepSize={1000000}
                  majorStepSize={1000000}
                  onValueChange={(event) => setLovelaceToSend(event)}
                />
              </FormGroup>

              <button
                style={{ padding: "10px" }}
                onClick={buildSendADATransaction}
              >
                Run
              </button>
            </div>
          }
        />
        <Tab
          id="2"
          title="2. Send Token to Address"
          panel={
            <div style={{ marginLeft: "20px" }}>
              <FormGroup
                helperText="insert an address where you want to send some ADA ..."
                label="Address where to send ADA"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) =>
                    setAddressBech32SendADA(event.target.value)
                  }
                  value={addressBech32SendADA}
                />
              </FormGroup>
              <FormGroup
                helperText="Make sure you have enough of Asset in your wallet ..."
                label="Amount of Assets to Send"
                labelFor="asset-amount-input"
              >
                <NumericInput
                  id="asset-amount-input"
                  disabled={false}
                  leftIcon={"variable"}
                  allowNumericCharactersOnly={true}
                  value={assetAmountToSend}
                  min={1}
                  stepSize={1}
                  majorStepSize={1}
                  onValueChange={(event) => setAssetAmountToSend(event)}
                />
              </FormGroup>
              <FormGroup
                helperText="Hex of the Policy Id"
                label="Asset PolicyId"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) => setAssetPolicyIdHex(event.target.value)}
                  value={assetPolicyIdHex}
                />
              </FormGroup>
              <FormGroup helperText="Hex of the Asset Name" label="Asset Name">
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) => setAssetNameHex(event.target.value)}
                  value={assetNameHex}
                />
              </FormGroup>

              <button
                style={{ padding: "10px" }}
                onClick={buildSendTokenTransaction}
              >
                Run
              </button>
            </div>
          }
        />
        <Tab
          id="3"
          title="3. Send ADA to Plutus Script"
          panel={
            <div style={{ marginLeft: "20px" }}>
              <FormGroup
                helperText="insert a Script address where you want to send some ADA ..."
                label="Script Address where to send ADA"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) =>
                    setAddressScriptBech32(event.target.value)
                  }
                  value={addressScriptBech32}
                />
              </FormGroup>
              <FormGroup
                helperText="Adjust Order Amount ..."
                label="Lovelaces (1 000 000 lovelaces = 1 ADA)"
                labelFor="order-amount-input2"
              >
                <NumericInput
                  id="order-amount-input2"
                  disabled={false}
                  leftIcon={"variable"}
                  allowNumericCharactersOnly={true}
                  value={lovelaceToSend}
                  min={1000000}
                  stepSize={1000000}
                  majorStepSize={1000000}
                  onValueChange={(event) => setLovelaceToSend(event)}
                />
              </FormGroup>
              <FormGroup
                helperText="insert a Datum ..."
                label="Datum that locks the ADA at the script address ..."
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) => setDatumStr(event.target.value)}
                  value={datumStr}
                />
              </FormGroup>
              <button
                style={{ padding: "10px" }}
                onClick={buildSendAdaToPlutusScript}
              >
                Run
              </button>
            </div>
          }
        />

        <Tab
          id="4"
          title="4. Send Token to Plutus Script"
          panel={
            <div style={{ marginLeft: "20px" }}>
              <FormGroup
                helperText="Script address where ADA is locked ..."
                label="Script Address"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) =>
                    setAddressScriptBech32(event.target.value)
                  }
                  value={addressScriptBech32}
                />
              </FormGroup>
              <FormGroup
                helperText="Need to send ADA with Tokens ..."
                label="Lovelaces (1 000 000 lovelaces = 1 ADA)"
                labelFor="order-amount-input2"
              >
                <NumericInput
                  id="order-amount-input2"
                  disabled={false}
                  leftIcon={"variable"}
                  allowNumericCharactersOnly={true}
                  value={lovelaceToSend}
                  min={1000000}
                  stepSize={1000000}
                  majorStepSize={1000000}
                  onValueChange={(event) => setLovelaceToSend(event)}
                />
              </FormGroup>
              <FormGroup
                helperText="Make sure you have enough of Asset in your wallet ..."
                label="Amount of Assets to Send"
                labelFor="asset-amount-input"
              >
                <NumericInput
                  id="asset-amount-input"
                  disabled={false}
                  leftIcon={"variable"}
                  allowNumericCharactersOnly={true}
                  value={assetAmountToSend}
                  min={1}
                  stepSize={1}
                  majorStepSize={1}
                  onValueChange={(event) => setAssetAmountToSend(event)}
                />
              </FormGroup>
              <FormGroup
                helperText="Hex of the Policy Id"
                label="Asset PolicyId"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) => setAssetPolicyIdHex(event.target.value)}
                  value={assetPolicyIdHex}
                />
              </FormGroup>
              <FormGroup helperText="Hex of the Asset Name" label="Asset Name">
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) => setAssetNameHex(event.target.value)}
                  value={assetNameHex}
                />
              </FormGroup>
              <FormGroup
                helperText="insert a Datum ..."
                label="Datum that locks the ADA at the script address ..."
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) => setDatumStr(event.target.value)}
                  value={datumStr}
                />
              </FormGroup>
              <button
                style={{ padding: "10px" }}
                onClick={buildSendTokenToPlutusScript}
              >
                Run
              </button>
            </div>
          }
        />
        <Tab
          id="5"
          title="5. Redeem ADA from Plutus Script"
          panel={
            <div style={{ marginLeft: "20px" }}>
              <FormGroup
                helperText="Script address where ADA is locked ..."
                label="Script Address"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) =>
                    setAddressScriptBech32(event.target.value)
                  }
                  value={addressScriptBech32}
                />
              </FormGroup>
              <FormGroup
                helperText="content of the plutus script encoded as CborHex ..."
                label="Plutus Script CborHex"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) =>
                    setPlutusScriptCborHex(event.target.value)
                  }
                  value={plutusScriptCborHex}
                />
              </FormGroup>
              <FormGroup
                helperText="Transaction hash ... If empty then run n. 3 first to lock some ADA"
                label="UTXO where ADA is locked"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) =>
                    setTransactionIdLocked(event.target.value)
                  }
                  value={transactionIdLocked}
                />
              </FormGroup>
              <FormGroup
                helperText="UTXO IndexId#, usually it's 0 ..."
                label="Transaction Index #"
                labelFor="order-amount-input2"
              >
                <NumericInput
                  id="order-amount-input2"
                  disabled={false}
                  leftIcon={"variable"}
                  allowNumericCharactersOnly={true}
                  value={transactionIndxLocked}
                  min={0}
                  stepSize={1}
                  majorStepSize={1}
                  onValueChange={(event) => setTransactionIndxLocked(event)}
                />
              </FormGroup>
              <FormGroup
                helperText="Adjust Order Amount ..."
                label="Lovelaces (1 000 000 lovelaces = 1 ADA)"
                labelFor="order-amount-input2"
              >
                <NumericInput
                  id="order-amount-input2"
                  disabled={false}
                  leftIcon={"variable"}
                  allowNumericCharactersOnly={true}
                  value={lovelaceLocked}
                  min={1000000}
                  stepSize={1000000}
                  majorStepSize={1000000}
                  onValueChange={(event) => setLovelaceLocked(event)}
                />
              </FormGroup>
              <FormGroup
                helperText="insert a Datum ..."
                label="Datum that unlocks the ADA at the script address ..."
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) => setDatumStr(event.target.value)}
                  value={datumStr}
                />
              </FormGroup>
              <FormGroup
                helperText="Needs to be enough to execute the contract ..."
                label="Manual Fee"
                labelFor="order-amount-input2"
              >
                <NumericInput
                  id="order-amount-input2"
                  disabled={false}
                  leftIcon={"variable"}
                  allowNumericCharactersOnly={true}
                  value={manualFee}
                  min={160000}
                  stepSize={100000}
                  majorStepSize={100000}
                  onValueChange={(event) => setManualFee(event)}
                />
              </FormGroup>
              <button
                style={{ padding: "10px" }}
                onClick={buildRedeemAdaFromPlutusScript}
              >
                Run
              </button>
              {/*<button style={{padding: "10px"}} onClick={signTransaction}>2. Sign Transaction</button>*/}
              {/*<button style={{padding: "10px"}} onClick={submitTransaction}>3. Submit Transaction</button>*/}
            </div>
          }
        />
        <Tab
          id="6"
          title="6. Redeem Tokens from Plutus Script"
          panel={
            <div style={{ marginLeft: "20px" }}>
              <FormGroup
                helperText="Script address where ADA is locked ..."
                label="Script Address"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) =>
                    setAddressScriptBech32(event.target.value)
                  }
                  value={addressScriptBech32}
                />
              </FormGroup>
              <FormGroup
                helperText="content of the plutus script encoded as CborHex ..."
                label="Plutus Script CborHex"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) =>
                    setPlutusScriptCborHex(event.target.value)
                  }
                  value={plutusScriptCborHex}
                />
              </FormGroup>
              <FormGroup
                helperText="Transaction hash ... If empty then run n. 3 first to lock some ADA"
                label="UTXO where ADA is locked"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) =>
                    setTransactionIdLocked(event.target.value)
                  }
                  value={transactionIdLocked}
                />
              </FormGroup>
              <FormGroup
                helperText="UTXO IndexId#, usually it's 0 ..."
                label="Transaction Index #"
                labelFor="order-amount-input2"
              >
                <NumericInput
                  id="order-amount-input2"
                  disabled={false}
                  leftIcon={"variable"}
                  allowNumericCharactersOnly={true}
                  value={transactionIndxLocked}
                  min={0}
                  stepSize={1}
                  majorStepSize={1}
                  onValueChange={(event) => setTransactionIndxLocked(event)}
                />
              </FormGroup>
              <FormGroup
                helperText="Adjust Order Amount ..."
                label="Lovelaces (1 000 000 lovelaces = 1 ADA)"
                labelFor="order-amount-input2"
              >
                <NumericInput
                  id="order-amount-input2"
                  disabled={false}
                  leftIcon={"variable"}
                  allowNumericCharactersOnly={true}
                  value={lovelaceLocked}
                  min={1000000}
                  stepSize={1000000}
                  majorStepSize={1000000}
                  onValueChange={(event) => setLovelaceLocked(event)}
                />
              </FormGroup>
              <FormGroup
                helperText="Make sure you have enough of Asset in your wallet ..."
                label="Amount of Assets to Reedem"
                labelFor="asset-amount-input"
              >
                <NumericInput
                  id="asset-amount-input"
                  disabled={false}
                  leftIcon={"variable"}
                  allowNumericCharactersOnly={true}
                  value={assetAmountToSend}
                  min={1}
                  stepSize={1}
                  majorStepSize={1}
                  onValueChange={(event) => setAssetAmountToSend(event)}
                />
              </FormGroup>
              <FormGroup
                helperText="Hex of the Policy Id"
                label="Asset PolicyId"
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) => setAssetPolicyIdHex(event.target.value)}
                  value={assetPolicyIdHex}
                />
              </FormGroup>
              <FormGroup helperText="Hex of the Asset Name" label="Asset Name">
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) => setAssetNameHex(event.target.value)}
                  value={assetNameHex}
                />
              </FormGroup>
              <FormGroup
                helperText="insert a Datum ..."
                label="Datum that unlocks the ADA at the script address ..."
              >
                <InputGroup
                  disabled={false}
                  leftIcon="id-number"
                  onChange={(event) => setDatumStr(event.target.value)}
                  value={datumStr}
                />
              </FormGroup>
              <FormGroup
                helperText="Needs to be enough to execute the contract ..."
                label="Manual Fee"
                labelFor="order-amount-input2"
              >
                <NumericInput
                  id="order-amount-input2"
                  disabled={false}
                  leftIcon={"variable"}
                  allowNumericCharactersOnly={true}
                  value={manualFee}
                  min={160000}
                  stepSize={100000}
                  majorStepSize={100000}
                  onValueChange={(event) => setManualFee(event)}
                />
              </FormGroup>
              <button
                style={{ padding: "10px" }}
                onClick={buildRedeemTokenFromPlutusScript}
              >
                Run
              </button>
            </div>
          }
        />
        <Tabs.Expander />
      </Tabs>

      <hr style={{ marginTop: "40px", marginBottom: "40px" }} />

      {/*<p>{`Unsigned txBodyCborHex: ${txBodyCborHex_unsigned}`}</p>*/}
      {/*<p>{`Signed txBodyCborHex: ${txBodyCborHex_signed}`}</p>*/}
      <p>{`Submitted Tx Hash: ${submittedTxHash}`}</p>
      <p>{submittedTxHash ? "check your wallet !" : ""}</p>
    </div>
  );
};

export default App;
