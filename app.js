const CONTRACT = "0xbc96600e2eE27364DE1719CAa3c69e5c566e8F6F";
const TOKEN_ID = 1;

const ABI = [
  "function publicMint(uint256 id,uint256 quantity) payable",
  "function creatorMint(address to,uint256 id,uint256 quantity)",
  "function totalMinted(uint256 id) view returns(uint256)",
  "function maxSupply(uint256 id) view returns(uint256)"
];

let provider;
let signer;
let contract;

const connectBtn = document.getElementById("connect");
const mintBtn = document.getElementById("mint");
const creatorMintBtn = document.getElementById("creatorMint");
const walletEl = document.getElementById("wallet");
const statusEl = document.getElementById("status");
const supplyEl = document.getElementById("supply");

async function connectWallet() {
  if (!window.ethereum) {
    alert("Install MetaMask atau wallet yang mendukung Web3.");
    return;
  }

  provider = new ethers.BrowserProvider(window.ethereum);

  await provider.send("eth_requestAccounts", []);

  const network = await provider.getNetwork();

  if (network.chainId !== 8453n) {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x2105" }]
    });
  }

  signer = await provider.getSigner();
  contract = new ethers.Contract(CONTRACT, ABI, signer);

  const address = await signer.getAddress();

  walletEl.textContent = address;
  statusEl.textContent = "Wallet terhubung.";
  await updateSupply();
}

async function updateSupply() {
  if (!contract) return;

  const minted = await contract.totalMinted(TOKEN_ID);
  const max = await contract.maxSupply(TOKEN_ID);

  supplyEl.textContent = `${minted.toString()} / ${max.toString()}`;
}

connectBtn.onclick = connectWallet;

mintBtn.onclick = async () => {
  try {
    if (!contract) await connectWallet();

    const quantity = Number(
      document.getElementById("quantity").value
    );

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Quantity tidak valid.");
    }

    statusEl.textContent = "Menunggu konfirmasi wallet...";

    const tx = await contract.publicMint(TOKEN_ID, quantity, {
      value: 0
    });

    statusEl.textContent =
      "Transaksi dikirim:\n" + tx.hash + "\nMenunggu konfirmasi...";

    await tx.wait();

    statusEl.textContent =
      "PUBLIC MINT BERHASIL!\n" + tx.hash;

    await updateSupply();
  } catch (err) {
    statusEl.textContent =
      "Mint gagal: " + (err.shortMessage || err.message);
  }
};

creatorMintBtn.onclick = async () => {
  try {
    if (!contract) await connectWallet();

    const recipient =
      document.getElementById("recipient").value.trim();

    const quantity = Number(
      document.getElementById("creatorQuantity").value
    );

    if (!ethers.isAddress(recipient)) {
      throw new Error("Alamat wallet tidak valid.");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Quantity tidak valid.");
    }

    statusEl.textContent = "Menunggu konfirmasi creator...";

    const tx = await contract.creatorMint(
      recipient,
      TOKEN_ID,
      quantity
    );

    statusEl.textContent =
      "Transaksi dikirim:\n" + tx.hash;

    await tx.wait();

    statusEl.textContent =
      "CREATOR MINT BERHASIL!\n" + tx.hash;

    await updateSupply();
  } catch (err) {
    statusEl.textContent =
      "Creator mint gagal: " +
      (err.shortMessage || err.message);
  }
};

window.addEventListener("load", async () => {
  try {
    provider = new ethers.JsonRpcProvider(
      "https://mainnet.base.org"
    );

    const readContract =
      new ethers.Contract(CONTRACT, ABI, provider);

    const minted =
      await readContract.totalMinted(TOKEN_ID);

    const max =
      await readContract.maxSupply(TOKEN_ID);

    supplyEl.textContent =
      `${minted.toString()} / ${max.toString()}`;
  } catch (err) {
    console.error(err);
  }
});
