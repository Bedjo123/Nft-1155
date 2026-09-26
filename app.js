const CONTRACT =
  "0x921c3aD8883050DC0deB9A7BECa60CB1EF6efAB0";

const CREATOR =
  "0xf0034424f9d99c120793a5bfe66af3e1a2a7e976";

const BASE_CHAIN_ID = 8453;

const ABI = [
  "function name() view returns (string)",
  "function maxSupply(uint256) view returns (uint256)",
  "function totalMinted(uint256) view returns (uint256)",
  "function mintPrice() view returns (uint256)",
  "function publicMintEnabled() view returns (bool)",
  "function publicMint(uint256,uint256) payable",
  "function creatorMint(address,uint256,uint256)"
];

let provider;
let signer;
let contract;
let connectedAddress;

const $ = id => document.getElementById(id);

function show(message) {
  $("status").textContent = message;
}

async function connectWallet() {
  if (!window.ethereum) {
    show("Wallet tidak ditemukan. Buka dengan Chrome + wallet.");
    return;
  }

  provider =
    new ethers.BrowserProvider(window.ethereum);

  await provider.send("eth_requestAccounts", []);

  const network =
    await provider.getNetwork();

  if (Number(network.chainId) !== BASE_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2105" }]
      });

      provider =
        new ethers.BrowserProvider(window.ethereum);

    } catch (error) {
      show("Silakan pindah ke Base.");
      return;
    }
  }

  signer =
    await provider.getSigner();

  connectedAddress =
    await signer.getAddress();

  contract =
    new ethers.Contract(
      CONTRACT,
      ABI,
      signer
    );

  $("wallet").textContent =
    connectedAddress;

  $("projectName").textContent =
    await contract.name();

  await updateSupply();

  show("Wallet terhubung ke Base.");
}

async function updateSupply() {
  if (!contract) return;

  const max =
    await contract.maxSupply(1);

  const minted =
    await contract.totalMinted(1);

  $("supply").textContent =
    `${minted} / ${max}`;
}

async function publicMint() {
  try {
    if (!contract) {
      await connectWallet();

      if (!contract) return;
    }

    const quantity =
      BigInt($("quantity").value);

    if (quantity <= 0n) {
      throw new Error("Quantity tidak valid.");
    }

    const enabled =
      await contract.publicMintEnabled();

    if (!enabled) {
      throw new Error(
        "Public mint sedang ditutup."
      );
    }

    const price =
      await contract.mintPrice();

    const value =
      price * quantity;

    show("Menunggu konfirmasi wallet...");

    const tx =
      await contract.publicMint(
        1,
        quantity,
        { value }
      );

    show(
      `Transaksi dikirim:\n${tx.hash}\n\nMenunggu confirmation...`
    );

    await tx.wait();

    await updateSupply();

    show(
      `MINT BERHASIL\n\nTX:\n${tx.hash}`
    );

  } catch (error) {

    show(
      error.shortMessage ||
      error.reason ||
      error.message ||
      String(error)
    );
  }
}

async function creatorMint() {
  try {

    if (!contract) {
      await connectWallet();

      if (!contract) return;
    }

    if (
      connectedAddress.toLowerCase() !==
      CREATOR.toLowerCase()
    ) {
      throw new Error(
        "Wallet bukan creator."
      );
    }

    const recipient =
      $("recipient").value.trim();

    if (!ethers.isAddress(recipient)) {
      throw new Error(
        "Alamat recipient tidak valid."
      );
    }

    const quantity =
      BigInt(
        $("creatorQuantity").value
      );

    if (quantity <= 0n) {
      throw new Error(
        "Quantity tidak valid."
      );
    }

    show(
      "Mengirim creator mint..."
    );

    const tx =
      await contract.creatorMint(
        recipient,
        1,
        quantity
      );

    show(
      `TX:\n${tx.hash}\n\nMenunggu confirmation...`
    );

    await tx.wait();

    await updateSupply();

    show(
      `CREATOR MINT BERHASIL\n\nTX:\n${tx.hash}`
    );

  } catch (error) {

    show(
      error.shortMessage ||
      error.reason ||
      error.message ||
      String(error)
    );
  }
}

$("connect").onclick =
  connectWallet;

$("mint").onclick =
  publicMint;

$("creatorMint").onclick =
  creatorMint;
