// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract BondToken is ERC20, ERC20Burnable {
    uint256 public couponRate;
    uint256 public maturityDate;
    string public termsIPFSHash;
    uint256 public issuePrice;
    address public immutable issuer;
    bool    public redeemed;

    

    event DvPTradeExecuted(address indexed seller, address indexed buyer, uint256 amount, uint256 price);

    event Redeemed(address indexed holder, uint256 amount);

    event BondClosed();


    modifier onlyIssuer   () { require(msg.sender == issuer,   "Solo el emisor");   _; }
    modifier notRedeemed  () { require(!redeemed,              "Bono redimido");    _; }
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 couponRate_,
        uint256 maturityDate_,
        string memory termsHash,
        uint256 issuePrice_
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
        couponRate = couponRate_;
        maturityDate = maturityDate_;
        termsIPFSHash = termsHash;
        issuePrice = issuePrice_;
        issuer = msg.sender; 
    }

    
    function executeDvPTrade(
        address seller,
        uint256 amount,
        uint256 price
    ) external payable {
        require(msg.value == price, "El ETH enviado no coincide con el precio acordado");
        require(seller != msg.sender, "Venta a uno mismo");
        require(allowance(seller, address(this)) >= amount, "El contrato no tiene aprobacion suficiente del vendedor");
        require(balanceOf(seller) >= amount, "El vendedor no tiene suficientes tokens");

        
        _transfer(seller, msg.sender, amount); 
        (bool ok,) = seller.call{value: msg.value}(""); 
        require(ok,"Pago fallido");  

        emit DvPTradeExecuted(seller, msg.sender, amount, msg.value);
    }

    
    function redeemFrom(address holder)
        external payable onlyIssuer notRedeemed
    {
        uint256 bal = balanceOf(holder);
        require(bal > 0, "Emisor sin balance");
        uint256 due = bal * issuePrice / 1e18;
        require(msg.value == due, "ETH incorrecto");
        _burn(holder, bal);
        (bool ok, ) = holder.call{ value: msg.value }("");
        require(ok, "Transferencia fallida");
        emit Redeemed(holder, bal);
        _maybeClose();                    
    }

    
    
    function closeBond() external onlyIssuer notRedeemed {
        uint256 bal = balanceOf(issuer);
        if (bal > 0) _burn(issuer, bal);
        _close();
    }

    
    function _payAndMaybeClose(address to, uint256 bal) private {
        uint256 ethDue = bal * issuePrice / 1e18;
        (bool ok, )   = to.call{ value: ethDue }("");
        require(ok, "Pago fallido");
        emit Redeemed(to, bal);
        _maybeClose();
    }

    function _maybeClose() private {
        if (totalSupply() == 0) _close();
    }

    function _close() private {
        redeemed = true;
        emit BondClosed();
    }

    receive() external payable {}
    fallback() external payable {}

} 