package com.expensesummary.sms

import android.Manifest
import android.content.pm.PackageManager
import android.provider.Telephony
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class SmsReaderModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), PermissionListener {

  companion object {
    const val NAME = "SmsReaderModule"
    private const val PERMISSION_REQ_CODE = 50123
  }

  private var pendingPermissionPromise: Promise? = null

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun hasPermissions(promise: Promise) {
    try {
      val permission = ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS)
      promise.resolve(permission == PackageManager.PERMISSION_GRANTED)
    } catch (e: Exception) {
      promise.reject("PERMISSION_CHECK_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun requestPermissions(promise: Promise) {
    try {
      val currentPermission = ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS)
      if (currentPermission == PackageManager.PERMISSION_GRANTED) {
        promise.resolve(true)
        return
      }

      val activity = currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Cannot request permissions without a foreground activity")
        return
      }

      if (activity is PermissionAwareActivity) {
        pendingPermissionPromise = promise
        activity.requestPermissions(
            arrayOf(Manifest.permission.READ_SMS),
            PERMISSION_REQ_CODE,
            this
        )
      } else {
        promise.reject("ACTIVITY_ERROR", "Activity does not implement PermissionAwareActivity")
      }
    } catch (e: Exception) {
      promise.reject("PERMISSION_REQUEST_ERROR", e.message, e)
    }
  }

  override fun onRequestPermissionsResult(
      requestCode: Int,
      permissions: Array<out String>?,
      grantResults: IntArray?
  ): Boolean {
    if (requestCode == PERMISSION_REQ_CODE) {
      val granted = grantResults != null && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
      pendingPermissionPromise?.resolve(granted)
      pendingPermissionPromise = null
      return true
    }
    return false
  }

  @ReactMethod
  fun fetchSmsBatch(
      senders: ReadableArray,
      minTimestamp: Double,
      maxLimit: Double,
      promise: Promise
  ) {
    try {
      val permission = ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS)
      if (permission != PackageManager.PERMISSION_GRANTED) {
        promise.reject("PERMISSION_DENIED", "READ_SMS permission is not granted")
        return
      }

      val senderList = mutableListOf<String>()
      for (i in 0 until senders.size()) {
        val s = senders.getString(i)?.trim()
        if (!s.isNullOrEmpty()) {
          senderList.add(s)
        }
      }

      val contentResolver = reactContext.contentResolver
      val uri = Telephony.Sms.CONTENT_URI
      val projection = arrayOf(
          Telephony.Sms._ID,
          Telephony.Sms.ADDRESS,
          Telephony.Sms.BODY,
          Telephony.Sms.DATE,
          Telephony.Sms.TYPE
      )

      val minDateMs = minTimestamp.toLong()
      val selection = StringBuilder("${Telephony.Sms.DATE} > ? AND ${Telephony.Sms.TYPE} = ?")
      val selectionArgsList = mutableListOf(minDateMs.toString(), Telephony.Sms.MESSAGE_TYPE_INBOX.toString())

      val sortOrder = "${Telephony.Sms.DATE} ASC"

      val cursor = contentResolver.query(
          uri,
          projection,
          selection.toString(),
          selectionArgsList.toTypedArray(),
          sortOrder
      )

      val resultList: WritableArray = Arguments.createArray()
      val limit = if (maxLimit > 0) maxLimit.toInt() else Int.MAX_VALUE
      var count = 0

      cursor?.use { c ->
        val idIdx = c.getColumnIndexOrThrow(Telephony.Sms._ID)
        val addressIdx = c.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
        val bodyIdx = c.getColumnIndexOrThrow(Telephony.Sms.BODY)
        val dateIdx = c.getColumnIndexOrThrow(Telephony.Sms.DATE)

        while (c.moveToNext() && count < limit) {
          val address = c.getString(addressIdx) ?: ""
          val body = c.getString(bodyIdx) ?: ""
          val smsId = c.getString(idIdx) ?: ""
          val date = c.getLong(dateIdx)

          // If sender rules are specified, verify match
          if (senderList.isNotEmpty()) {
            val matches = senderList.any { senderRule ->
              matchesSender(address, senderRule)
            }
            if (!matches) {
              continue
            }
          }

          val map: WritableMap = Arguments.createMap()
          map.putString("id", smsId)
          map.putString("sender", address)
          map.putString("body", body)
          map.putDouble("timestamp", date.toDouble())

          resultList.pushMap(map)
          count++
        }
      }

      promise.resolve(resultList)
    } catch (e: Exception) {
      promise.reject("SMS_QUERY_ERROR", e.message, e)
    }
  }

  private fun matchesSender(address: String, senderRule: String): Boolean {
    val cleanAddress = address.trim()
    val cleanRule = senderRule.trim()
    if (cleanAddress.equals(cleanRule, ignoreCase = true)) {
      return true
    }
    // Handle 2-character telecom routing prefixes like "VK-HDFCBK" or "AD-SBIINB"
    if (cleanAddress.endsWith("-$cleanRule", ignoreCase = true) ||
        cleanAddress.endsWith(cleanRule, ignoreCase = true)) {
      return true
    }
    return false
  }
}
