// Imports
const express = require('express')
const Razorpay = require('razorpay')
const router = express.Router()
const PaymentDetail =  require('../../models/payment-detail')

// Create an instance of Razorpay
let razorPayInstance = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID,
	key_secret: process.env.RAZORPAY_KEY_SECRET
})

/**
 * Get Order ID from Razor Pay
 * 
 */
router.post("/payment/order", (req, res)=>{
	params = req.body;
	razorPayInstance.orders.create(params)
	.then(async (response) => {
		const paymentDetail = new PaymentDetail({
			orderId: response.id,
			receiptId: response.receipt,
			amount: response.amount,
			currency: response.currency,
			createdAt: response.created_at,
			status: response.status
		})

		try {
			await paymentDetail.save()
			res.status(201).json({
				success: true,
				message: 'Payment order generated successfully',
				data: response
			})
		} catch (err) {
			res.status(400).json({
				success: false,
				message: err.message,
				data: null
			})
		}
	}).catch((err) => {
		res.status(400).json({
			success: false,
			message: err.message,
			data: null
		});
	})
});

/**
 * Verify Signature
 * 
 */
router.post("/payment/verify", async (req, res) => {
	body=req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
	let crypto = require("crypto");
	let expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
							.update(body.toString())
							.digest('hex');

	if(expectedSignature === req.body.razorpay_signature) {
		await PaymentDetail.findOneAndUpdate(
			{ orderId: req.body.razorpay_order_id },
			{
				paymentId: req.body.razorpay_payment_id,
				signature: req.body.razorpay_signature,
				status: "paid"
			},
			{ new: true },
			function(err, doc) {
				if(err){
					res.status(500).json({
						success: false,
						message: err.message,
						data: null
					})
				}
				res.status(200).json({
					success: true,
					message: err.message,
					data: doc
				})
			}
		);
	} else {
		res.status(401).json({
			success: false,
			message: "Payment signature verification failed",
			data: null
		})
	}
});

module.exports = router;